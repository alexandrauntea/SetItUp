const fs = require("node:fs");
const path = require("node:path");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} = require("firebase/firestore");

const PROJECT_ID = "demo-setitup";
const ALICE_UID = "alice-uid";
const BOB_UID = "bob-uid";
const OUTSIDER_UID = "outsider-uid";

const rules = fs.readFileSync(
  path.resolve(__dirname, "../../database/firestore.rules"),
  "utf8",
);

let testEnv;

function privateProfile(uid, username, email) {
  return {
    uid,
    username,
    email,
    birthDate: "02/08/2000",
    firstName: username,
    lastName: "Test",
    occupation: "Student",
    gender: "other",
    description: "Profil de test",
    interests: ["Tehnologie"],
    isPrivate: false,
    gdprAcceptedAt: "2026-08-12T10:00:00.000Z",
    profileCompleted: true,
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
  };
}

function publicProfile(uid, username, isPrivate = false) {
  return {
    uid,
    username,
    firstName: username,
    lastName: "Test",
    occupation: "Student",
    gender: "other",
    description: "Profil public de test",
    interests: ["Tehnologie"],
    age: 26,
    isPrivate,
    updatedAt: "2026-08-12T10:00:00.000Z",
  };
}

function friendRequest() {
  return {
    id: `${ALICE_UID}_${BOB_UID}`,
    senderId: ALICE_UID,
    senderUsername: "alice",
    receiverId: BOB_UID,
    receiverUsername: "bob",
    memberIds: [ALICE_UID, BOB_UID],
    status: "pending",
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
  };
}

async function seedDocument(collectionName, documentId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), collectionName, documentId), data);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Regulile profilului", () => {
  test("ownerul creează atomic username-ul, profilul privat și profilul public", async () => {
    const alice = testEnv.authenticatedContext(ALICE_UID, {
      email: "alice@example.com",
    });
    const db = alice.firestore();
    const batch = writeBatch(db);

    batch.set(doc(db, "usernames", "alice"), {
      uid: ALICE_UID,
      createdAt: "2026-08-12T10:00:00.000Z",
    });
    batch.set(
      doc(db, "users", ALICE_UID),
      privateProfile(ALICE_UID, "alice", "alice@example.com"),
    );
    batch.set(
      doc(db, "publicProfiles", ALICE_UID),
      publicProfile(ALICE_UID, "alice"),
    );

    await assertSucceeds(batch.commit());
  });

  test("un utilizator nu poate crea profilul privat al altcuiva", async () => {
    const alice = testEnv.authenticatedContext(ALICE_UID, {
      email: "alice@example.com",
    });

    await assertFails(
      setDoc(
        doc(alice.firestore(), "users", BOB_UID),
        privateProfile(BOB_UID, "bob", "bob@example.com"),
      ),
    );
  });

  test("numai ownerul poate citi profilul privat", async () => {
    await seedDocument(
      "users",
      ALICE_UID,
      privateProfile(ALICE_UID, "alice", "alice@example.com"),
    );
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertSucceeds(getDoc(doc(alice.firestore(), "users", ALICE_UID)));
    await assertFails(getDoc(doc(bob.firestore(), "users", ALICE_UID)));
  });

  test("un profil public este vizibil, iar unul privat rămâne ascuns", async () => {
    const bob = testEnv.authenticatedContext(BOB_UID);
    await seedDocument(
      "publicProfiles",
      ALICE_UID,
      publicProfile(ALICE_UID, "alice", false),
    );

    await assertSucceeds(
      getDoc(doc(bob.firestore(), "publicProfiles", ALICE_UID)),
    );

    await seedDocument(
      "publicProfiles",
      ALICE_UID,
      publicProfile(ALICE_UID, "alice", true),
    );
    await assertFails(
      getDoc(doc(bob.firestore(), "publicProfiles", ALICE_UID)),
    );
  });

  test("ownerul poate edita câmpurile profilului, dar nu își poate schimba emailul", async () => {
    await seedDocument(
      "users",
      ALICE_UID,
      privateProfile(ALICE_UID, "alice", "alice@example.com"),
    );
    const alice = testEnv.authenticatedContext(ALICE_UID, {
      email: "alice@example.com",
    });
    const ref = doc(alice.firestore(), "users", ALICE_UID);

    await assertSucceeds(
      updateDoc(ref, {
        occupation: "Developer",
        updatedAt: "2026-08-12T11:00:00.000Z",
      }),
    );
    await assertFails(updateDoc(ref, { email: "changed@example.com" }));
  });
});

describe("Regulile cererii de prietenie", () => {
  test("senderul autentificat poate crea cererea în care este participant", async () => {
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const request = friendRequest();

    await assertSucceeds(
      setDoc(
        doc(alice.firestore(), "friendRequests", request.id),
        request,
      ),
    );
  });

  test("alt utilizator nu poate crea cererea în numele senderului", async () => {
    const bob = testEnv.authenticatedContext(BOB_UID);
    const request = friendRequest();

    await assertFails(
      setDoc(doc(bob.firestore(), "friendRequests", request.id), request),
    );
  });

  test("un utilizator neautentificat nu poate crea o cerere", async () => {
    const anonymous = testEnv.unauthenticatedContext();
    const request = friendRequest();

    await assertFails(
      setDoc(
        doc(anonymous.firestore(), "friendRequests", request.id),
        request,
      ),
    );
  });

  test("numai participanții pot citi direct cererea", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const bob = testEnv.authenticatedContext(BOB_UID);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);

    await assertSucceeds(
      getDoc(doc(alice.firestore(), "friendRequests", request.id)),
    );
    await assertSucceeds(
      getDoc(doc(bob.firestore(), "friendRequests", request.id)),
    );
    await assertFails(
      getDoc(doc(outsider.firestore(), "friendRequests", request.id)),
    );
  });
});
