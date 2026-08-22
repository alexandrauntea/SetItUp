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

function confirmationFor(projectId) {
  return `DELETE_ALL_DATA_${projectId}`;
}

function printUsage(projectId = DEFAULT_PROJECT_ID) {
  console.log(`
Utilizare (simulare):
  npm run reset:all

Ștergere reală:
  npm run reset:all -- --execute --confirm ${confirmationFor(projectId)}

Opțiuni:
  --project PROJECT_ID       implicit: ${DEFAULT_PROJECT_ID}
  --bucket BUCKET_NAME       implicit: ${DEFAULT_STORAGE_BUCKET}
  --execute                  execută resetarea; în lipsă rulează doar simularea
  --confirm TEXT             protecție obligatorie pentru --execute

Scriptul șterge TOATE conturile Firebase Authentication, TOATE documentele și
subcolecțiile Firestore și TOATE fotografiile din profilePhotos/.
Nu șterge proiectul Firebase, regulile, indexurile sau configurația aplicației.
`);
}

const { values, flags } = parseArguments(process.argv.slice(2));
const projectId = values.get("project") || DEFAULT_PROJECT_ID;
const storageBucket = values.get("bucket") || DEFAULT_STORAGE_BUCKET;
const execute = flags.has("execute");
const expectedConfirmation = confirmationFor(projectId);

if (flags.has("help")) {
  printUsage(projectId);
  process.exit();
}

if (execute && values.get("confirm") !== expectedConfirmation) {
  throw new Error(
    `Confirmare invalidă. Adaugă: --confirm ${expectedConfirmation}`,
  );
}

initializeApp({
  credential: applicationDefault(),
  projectId,
  storageBucket,
});

const auth = getAuth();
const db = getFirestore();
const bucket = getStorage().bucket();

async function listAllUsers() {
  const users = [];
  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

async function inspectFirestore() {
  const collections = await db.listCollections();
  const summaries = [];

  for (const collection of collections) {
    const snapshot = await collection.get();
    summaries.push({
      collection,
      documentCount: snapshot.size,
      documents: snapshot.docs,
    });
  }

  return summaries.sort((first, second) =>
    first.collection.id.localeCompare(second.collection.id),
  );
}

async function listProfilePhotos() {
  const [files] = await bucket.getFiles({ prefix: "profilePhotos/" });
  return files;
}

async function deleteFirestoreData(summaries) {
  let deleted = 0;

  for (const summary of summaries) {
    for (const document of summary.documents) {
      await db.recursiveDelete(document.ref);
      deleted += 1;
    }
    console.log(
      `Curățat Firestore: ${summary.collection.id} (${summary.documentCount} documente rădăcină)`,
    );
  }

  return deleted;
}

async function deleteProfilePhotos(files) {
  for (const file of files) {
    await file.delete({ ignoreNotFound: true });
  }
  return files.length;
}

async function deleteAuthenticationUsers(users) {
  let deleted = 0;

  for (let index = 0; index < users.length; index += 1000) {
    const batch = users.slice(index, index + 1000);
    const result = await auth.deleteUsers(batch.map((user) => user.uid));

    if (result.failureCount > 0) {
      const failures = result.errors
        .map(({ index: failedIndex, error }) => {
          const user = batch[failedIndex];
          return `${user.email || user.uid}: ${error.message}`;
        })
        .join("; ");
      throw new Error(`Unele conturi nu au putut fi șterse: ${failures}`);
    }

    deleted += result.successCount;
  }

  return deleted;
}

async function main() {
  console.log(`Proiect: ${projectId}`);
  console.log(`Bucket: ${storageBucket}`);
  console.log(`Mod: ${execute ? "RESETARE REALĂ" : "SIMULARE (dry-run)"}`);

  const [users, firestoreSummaries, profilePhotos] = await Promise.all([
    listAllUsers(),
    inspectFirestore(),
    listProfilePhotos(),
  ]);

  console.log(`\nConturi Authentication: ${users.length}`);
  for (const user of users) {
    console.log(`  - ${user.email || "(fără email)"} [${user.uid}]`);
  }

  console.log("\nColecții Firestore:");
  if (firestoreSummaries.length === 0) console.log("  (niciuna)");
  for (const summary of firestoreSummaries) {
    console.log(
      `  - ${summary.collection.id}: ${summary.documentCount} documente rădăcină`,
    );
  }

  console.log(`\nFotografii Storage din profilePhotos/: ${profilePhotos.length}`);
  for (const file of profilePhotos) console.log(`  - ${file.name}`);

  if (!execute) {
    console.log(
      `\nNu s-a șters nimic. După verificare, repetă cu --execute --confirm ${expectedConfirmation}.`,
    );
    return;
  }

  // Conturile sunt eliminate ultimele, după datele care depind de UID-urile lor.
  const deletedFirestoreDocuments =
    await deleteFirestoreData(firestoreSummaries);
  const deletedPhotos = await deleteProfilePhotos(profilePhotos);
  const deletedUsers = await deleteAuthenticationUsers(users);

  console.log("\nResetare încheiată.");
  console.log(
    `Documente Firestore rădăcină șterse recursiv: ${deletedFirestoreDocuments}`,
  );
  console.log(`Fotografii Storage șterse: ${deletedPhotos}`);
  console.log(`Conturi Authentication șterse: ${deletedUsers}`);
}

main().catch((error) => {
  console.error("\nResetarea completă a eșuat:", error.message || error);
  process.exitCode = 1;
});
