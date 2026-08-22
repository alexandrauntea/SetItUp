import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const DEFAULT_PROJECT_ID = "setitup-84173";
const DEFAULT_STORAGE_BUCKET = "setitup-84173.firebasestorage.app";

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
  npm run cleanup:user -- --email utilizator@example.com

Ștergere reală (confirmarea trebuie să fie chiar emailul contului):
  npm run cleanup:user -- --email utilizator@example.com --execute --confirm utilizator@example.com

Opțiuni:
  --project PROJECT_ID       implicit: ${DEFAULT_PROJECT_ID}
  --bucket BUCKET_NAME       implicit: ${DEFAULT_STORAGE_BUCKET}
  --protect-email EMAIL      poate fi repetat logic prin PROTECTED_EMAILS
  --execute                  execută ștergerea; în lipsă rulează doar simularea
  --confirm EMAIL            protecție obligatorie pentru --execute

Variabile de mediu:
  PROTECTED_EMAILS=email1@example.com,email2@example.com
`);
}

const { values, flags } = parseArguments(process.argv.slice(2));
const requestedEmail = values.get("email")?.trim().toLowerCase();
const execute = flags.has("execute");

if (flags.has("help")) {
  printUsage();
  process.exit();
}

if (!requestedEmail || values.has("uid")) {
  printUsage();
  process.exitCode = 1;
  process.exit();
}

const projectId = values.get("project") || DEFAULT_PROJECT_ID;
const storageBucket = values.get("bucket") || DEFAULT_STORAGE_BUCKET;

initializeApp({
  credential: applicationDefault(),
  projectId,
  storageBucket,
});

const auth = getAuth();
const db = getFirestore();
const bucket = getStorage().bucket();

const protectedEmails = new Set(
  [
    ...(process.env.PROTECTED_EMAILS || "").split(","),
    values.get("protect-email") || "",
  ]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const relationalQueries = [
  ["friendRequests", "memberIds", "array-contains"],
  ["friendships", "memberIds", "array-contains"],
  ["managerRequests", "memberIds", "array-contains"],
  ["managerRelationships", "memberIds", "array-contains"],
  ["managerRoles", "counterpartId", "=="],
  ["reactions", "ownerId", "=="],
  ["reactions", "targetId", "=="],
  ["reactions", "actorId", "=="],
  ["likes", "fromOwnerId", "=="],
  ["likes", "toOwnerId", "=="],
  ["dislikes", "fromOwnerId", "=="],
  ["dislikes", "toOwnerId", "=="],
  ["matches", "memberIds", "array-contains"],
  ["conversations", "memberIds", "array-contains"],
  ["conversations", "managerIds", "array-contains"],
  ["blocks", "blockerId", "=="],
  ["blocks", "blockedId", "=="],
];

function addReference(referenceMap, reference, recursive = false) {
  const current = referenceMap.get(reference.path);
  referenceMap.set(reference.path, {
    reference,
    recursive: recursive || current?.recursive || false,
  });
}

async function resolveUser() {
  return auth.getUserByEmail(requestedEmail);
}

async function collectFirestoreReferences(uid) {
  const references = new Map();
  const directPaths = [
    `users/${uid}`,
    `publicProfiles/${uid}`,
    `preferences/${uid}`,
    `managerRoles/${uid}`,
  ];

  for (const path of directPaths) {
    const reference = db.doc(path);
    if ((await reference.get()).exists) addReference(references, reference);
  }

  const usernameEntries = await db
    .collection("usernames")
    .where("uid", "==", uid)
    .get();
  for (const document of usernameEntries.docs) {
    addReference(references, document.ref);
  }

  for (const [collectionName, field, operator] of relationalQueries) {
    const snapshot = await db
      .collection(collectionName)
      .where(field, operator, uid)
      .get();

    for (const document of snapshot.docs) {
      addReference(
        references,
        document.ref,
        collectionName === "conversations",
      );
    }
  }

  return [...references.values()].sort((first, second) =>
    first.reference.path.localeCompare(second.reference.path),
  );
}

async function listStorageFiles(uid) {
  const [files] = await bucket.getFiles({ prefix: `profilePhotos/${uid}/` });
  return files;
}

async function main() {
  const user = await resolveUser();
  const uid = user.uid;
  const email = user.email?.toLowerCase() || "(fără email)";

  console.log(`Proiect: ${projectId}`);
  console.log(`Utilizator: ${email}`);
  console.log(`UID: ${uid}`);
  console.log(`Mod: ${execute ? "ȘTERGERE REALĂ" : "SIMULARE (dry-run)"}`);

  if (user.email && protectedEmails.has(user.email.toLowerCase())) {
    throw new Error(`Contul ${user.email} este protejat și nu poate fi șters.`);
  }

  const confirmationEmail = values.get("confirm")?.trim().toLowerCase();
  if (execute && confirmationEmail !== requestedEmail) {
    throw new Error(
      `Confirmare invalidă. Pentru ștergere reală adaugă: --confirm ${requestedEmail}`,
    );
  }

  const firestoreReferences = await collectFirestoreReferences(uid);
  const storageFiles = await listStorageFiles(uid);

  console.log("\nDocumente Firestore găsite:");
  if (firestoreReferences.length === 0) console.log("  (niciunul)");
  for (const { reference, recursive } of firestoreReferences) {
    console.log(`  - ${reference.path}${recursive ? " (recursiv)" : ""}`);
  }

  console.log("\nFișiere Storage găsite:");
  if (storageFiles.length === 0) console.log("  (niciunul)");
  for (const file of storageFiles) console.log(`  - ${file.name}`);

  if (!execute) {
    console.log(
      `\nNu s-a șters nimic. După verificare, repetă cu --execute --confirm ${requestedEmail}.`,
    );
    return;
  }

  for (const { reference, recursive } of firestoreReferences) {
    if (recursive) await db.recursiveDelete(reference);
    else await reference.delete();
    console.log(`Șters Firestore: ${reference.path}`);
  }

  for (const file of storageFiles) {
    await file.delete({ ignoreNotFound: true });
    console.log(`Șters Storage: ${file.name}`);
  }

  // Authentication este șters ultimul, după toate datele dependente.
  await auth.deleteUser(uid);
  console.log(`Șters Authentication: ${uid}`);
  console.log("\nCurățarea utilizatorului s-a încheiat.");
}

main().catch((error) => {
  console.error("\nCurățarea a eșuat:", error.message || error);
  process.exitCode = 1;
});
