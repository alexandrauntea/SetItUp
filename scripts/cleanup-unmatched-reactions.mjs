import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID = "setitup-84173";
const EXECUTION_CONFIRMATION = "DELETE_UNMATCHED_REACTIONS";

function parseArguments(argv) {
  const values = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;

    const [rawName, inlineValue] = argument.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      values.set(rawName, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(rawName, next);
      index += 1;
    } else {
      flags.add(rawName);
    }
  }

  return { values, flags };
}

function printUsage() {
  console.log(`
Utilizare:
  npm run cleanup:reactions

Ștergere reală:
  npm run cleanup:reactions -- --execute --confirm ${EXECUTION_CONFIRMATION}

Opțiuni:
  --project PROJECT_ID       implicit: ${DEFAULT_PROJECT_ID}
  --execute                  execută ștergerea; în lipsă rulează doar simularea
  --confirm TEXT             protecție obligatorie pentru --execute

Scriptul șterge din întreaga aplicație numai reacțiile dintre utilizatori care
nu au un document de potrivire în colecția matches.
`);
}

function createPairId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

function readReaction(document) {
  const data = document.data();
  const ownerId = typeof data.ownerId === "string" ? data.ownerId.trim() : "";
  const targetId = typeof data.targetId === "string" ? data.targetId.trim() : "";

  if (!ownerId || !targetId || ownerId === targetId) return null;

  return {
    document,
    ownerId,
    targetId,
    matchId: createPairId(ownerId, targetId),
    value: typeof data.value === "string" ? data.value : "valoare necunoscută",
  };
}

const { values, flags } = parseArguments(process.argv.slice(2));
const execute = flags.has("execute");

if (flags.has("help")) {
  printUsage();
  process.exit();
}

if (execute && values.get("confirm") !== EXECUTION_CONFIRMATION) {
  throw new Error(
    `Confirmare invalidă. Adaugă: --confirm ${EXECUTION_CONFIRMATION}`,
  );
}

const projectId = values.get("project") || DEFAULT_PROJECT_ID;

initializeApp({
  credential: applicationDefault(),
  projectId,
});

const db = getFirestore();

async function collectCandidates() {
  const [reactionsSnapshot, matchesSnapshot] = await Promise.all([
    db.collection("reactions").get(),
    db.collection("matches").get(),
  ]);

  const matchIds = new Set(matchesSnapshot.docs.map((document) => document.id));
  const validReactions = [];
  const malformedReactions = [];

  for (const document of reactionsSnapshot.docs) {
    const reaction = readReaction(document);
    if (reaction) validReactions.push(reaction);
    else malformedReactions.push(document);
  }

  return {
    totalReactions: reactionsSnapshot.size,
    totalMatches: matchesSnapshot.size,
    candidates: validReactions
      .filter((reaction) => !matchIds.has(reaction.matchId))
      .sort((first, second) =>
        first.document.ref.path.localeCompare(second.document.ref.path),
      ),
    preserved: validReactions.filter((reaction) => matchIds.has(reaction.matchId)),
    malformedReactions,
  };
}

async function safelyDeleteCandidate(candidate) {
  return db.runTransaction(async (transaction) => {
    const reactionRef = candidate.document.ref;
    const matchRef = db.collection("matches").doc(candidate.matchId);
    const [reactionSnapshot, matchSnapshot] = await Promise.all([
      transaction.get(reactionRef),
      transaction.get(matchRef),
    ]);

    // Potrivirea poate fi creată după simulare sau chiar în timpul curățării.
    if (matchSnapshot.exists || !reactionSnapshot.exists) return false;

    const currentReaction = readReaction(reactionSnapshot);
    if (
      !currentReaction ||
      currentReaction.ownerId !== candidate.ownerId ||
      currentReaction.targetId !== candidate.targetId
    ) {
      return false;
    }

    transaction.delete(reactionRef);
    return true;
  });
}

async function main() {
  console.log(`Proiect: ${projectId}`);
  console.log(`Mod: ${execute ? "ȘTERGERE REALĂ" : "SIMULARE (dry-run)"}`);

  const result = await collectCandidates();

  console.log(`\nReacții totale: ${result.totalReactions}`);
  console.log(`Potriviri totale: ${result.totalMatches}`);
  console.log(`Reacții păstrate datorită unei potriviri: ${result.preserved.length}`);
  console.log(`Reacții cu date invalide, ignorate: ${result.malformedReactions.length}`);
  console.log(`Reacții fără potrivire: ${result.candidates.length}`);

  console.log("\nReacții care pot fi eliminate:");
  if (result.candidates.length === 0) console.log("  (niciuna)");
  for (const candidate of result.candidates) {
    console.log(
      `  - ${candidate.document.ref.path} (${candidate.value}, ${candidate.ownerId} → ${candidate.targetId})`,
    );
  }

  if (result.malformedReactions.length > 0) {
    console.log("\nReacții invalide păstrate pentru verificare manuală:");
    for (const document of result.malformedReactions) {
      console.log(`  - ${document.ref.path}`);
    }
  }

  if (!execute) {
    console.log(
      `\nNu s-a șters nimic. După verificare, repetă folosind --execute --confirm ${EXECUTION_CONFIRMATION}.`,
    );
    return;
  }

  let deletedCount = 0;
  let skippedCount = 0;

  for (const candidate of result.candidates) {
    if (await safelyDeleteCandidate(candidate)) deletedCount += 1;
    else skippedCount += 1;
  }

  console.log(`\nCurățare încheiată. Reacții șterse: ${deletedCount}.`);
  if (skippedCount > 0) {
    console.log(
      `Reacții păstrate după reverificarea tranzacțională: ${skippedCount}.`,
    );
  }
}

main().catch((error) => {
  console.error("\nCurățarea reacțiilor a eșuat:", error.message || error);
  process.exitCode = 1;
});
