const fs = require("node:fs");
const path = require("node:path");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
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

function friendship() {
  return {
    id: `${ALICE_UID}_${BOB_UID}`,
    memberIds: [ALICE_UID, BOB_UID],
    memberUsernames: ["alice", "bob"],
    createdAt: "2026-08-12T10:00:00.000Z",
  };
}

function managerRequest() {
  return {
    id: ALICE_UID,
    ownerId: ALICE_UID,
    ownerUsername: "alice",
    managerId: BOB_UID,
    managerUsername: "bob",
    memberIds: [ALICE_UID, BOB_UID],
    status: "pending",
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
  };
}

function managerRelationship() {
  return {
    ownerId: ALICE_UID,
    ownerUsername: "alice",
    managerId: BOB_UID,
    managerUsername: "bob",
    memberIds: [ALICE_UID, BOB_UID],
    createdAt: "2026-08-12T10:00:00.000Z",
  };
}

function managerRole(uid, role, counterpartId) {
  return {
    uid,
    role,
    counterpartId,
    createdAt: "2026-08-12T10:00:00.000Z",
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

  test("profilurile publice și private pot fi deschise de utilizatorii autentificați", async () => {
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
    await assertSucceeds(
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
    await seedDocument("usernames", "alice", {
      uid: ALICE_UID,
      createdAt: "2026-08-12T10:00:00.000Z",
    });
    await seedDocument("usernames", "bob", {
      uid: BOB_UID,
      createdAt: "2026-08-12T10:00:00.000Z",
    });
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

  test("o cerere cu ID sau structură falsificată este refuzată", async () => {
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const request = { ...friendRequest(), injectedRole: "admin" };

    await assertFails(
      setDoc(
        doc(alice.firestore(), "friendRequests", "id-falsificat"),
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

  test("receiverul poate lista numai cererile primite", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const bob = testEnv.authenticatedContext(BOB_UID);
    const incomingQuery = query(
      collection(bob.firestore(), "friendRequests"),
      where("receiverId", "==", BOB_UID),
    );

    const snapshot = await assertSucceeds(getDocs(incomingQuery));

    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].id).toBe(request.id);
  });

  test("senderul poate lista numai cererile trimise", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const outgoingQuery = query(
      collection(alice.firestore(), "friendRequests"),
      where("senderId", "==", ALICE_UID),
    );

    const snapshot = await assertSucceeds(getDocs(outgoingQuery));

    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].id).toBe(request.id);
  });

  test("un utilizator nu poate lista cererile altuia", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);
    const otherUsersQuery = query(
      collection(outsider.firestore(), "friendRequests"),
      where("receiverId", "==", BOB_UID),
    );

    await assertFails(getDocs(otherUsersQuery));
  });

  test("participanții pot șterge cererea, dar un utilizator străin nu", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);

    await assertFails(
      deleteDoc(doc(outsider.firestore(), "friendRequests", request.id)),
    );

    const bob = testEnv.authenticatedContext(BOB_UID);
    await assertSucceeds(
      deleteDoc(doc(bob.firestore(), "friendRequests", request.id)),
    );
  });
});

describe("Regulile listei de prieteni", () => {
  test("receiverul acceptă atomic cererea și creează prietenia", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();
    const requestRef = doc(firestore, "friendRequests", request.id);
    const friendshipRef = doc(firestore, "friendships", request.id);

    await assertSucceeds(
      runTransaction(firestore, async (transaction) => {
        const requestSnapshot = await transaction.get(requestRef);

        expect(requestSnapshot.exists()).toBe(true);

        transaction.set(friendshipRef, friendship());
        transaction.delete(requestRef);
      }),
    );

    expect((await getDoc(requestRef)).exists()).toBe(false);
    expect((await getDoc(friendshipRef)).exists()).toBe(true);
  });

  test("un participant nu poate crea direct o prietenie", async () => {
    const request = friendRequest();
    await seedDocument("friendRequests", request.id, request);
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertFails(
      setDoc(
        doc(bob.firestore(), "friendships", request.id),
        friendship(),
      ),
    );
  });

  test("un participant poate lista prieteniile care îl conțin", async () => {
    const data = friendship();
    await seedDocument("friendships", data.id, data);
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const friendsQuery = query(
      collection(alice.firestore(), "friendships"),
      where("memberIds", "array-contains", ALICE_UID),
    );

    const snapshot = await assertSucceeds(getDocs(friendsQuery));

    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].id).toBe(data.id);
  });

  test("un utilizator nu poate interoga lista de prieteni a altcuiva", async () => {
    const data = friendship();
    await seedDocument("friendships", data.id, data);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);
    const otherUserFriendsQuery = query(
      collection(outsider.firestore(), "friendships"),
      where("memberIds", "array-contains", ALICE_UID),
    );

    await assertFails(getDocs(otherUserFriendsQuery));
  });

  test("numai participanții pot elimina prietenia", async () => {
    const data = friendship();
    await seedDocument("friendships", data.id, data);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);

    await assertFails(
      deleteDoc(doc(outsider.firestore(), "friendships", data.id)),
    );

    const alice = testEnv.authenticatedContext(ALICE_UID);
    await assertSucceeds(
      deleteDoc(doc(alice.firestore(), "friendships", data.id)),
    );
  });
});

describe("Regulile managerului", () => {
  test("managerul acceptă atomic cererea și creează relația", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    await seedDocument("friendships", friendship().id, friendship());
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();
    const requestRef = doc(firestore, "managerRequests", data.id);
    const relationshipRef = doc(
      firestore,
      "managerRelationships",
      data.ownerId,
    );
    const ownerRoleRef = doc(firestore, "managerRoles", data.ownerId);
    const managerRoleRef = doc(firestore, "managerRoles", data.managerId);

    await assertSucceeds(
      runTransaction(firestore, async (transaction) => {
        const requestSnapshot = await transaction.get(requestRef);
        const relationshipSnapshot = await transaction.get(relationshipRef);
        const ownerRoleSnapshot = await transaction.get(ownerRoleRef);
        const managerRoleSnapshot = await transaction.get(managerRoleRef);

        expect(requestSnapshot.exists()).toBe(true);
        expect(relationshipSnapshot.exists()).toBe(false);
        expect(ownerRoleSnapshot.exists()).toBe(false);
        expect(managerRoleSnapshot.exists()).toBe(false);

        transaction.set(relationshipRef, managerRelationship());
        transaction.set(
          ownerRoleRef,
          managerRole(data.ownerId, "owner", data.managerId),
        );
        transaction.set(
          managerRoleRef,
          managerRole(data.managerId, "manager", data.ownerId),
        );
        transaction.delete(requestRef);
      }),
    );

    expect((await getDoc(requestRef)).exists()).toBe(false);
    expect((await getDoc(relationshipRef)).exists()).toBe(true);
    expect((await getDoc(managerRoleRef)).exists()).toBe(true);
  });

  test("managerul poate accepta o cerere creată cu vechiul ID", async () => {
    const data = {
      ...managerRequest(),
      id: `${ALICE_UID}_${BOB_UID}`,
    };
    await seedDocument("managerRequests", data.id, data);
    await seedDocument("friendships", friendship().id, friendship());
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();
    const requestRef = doc(firestore, "managerRequests", data.id);
    const relationshipRef = doc(
      firestore,
      "managerRelationships",
      data.ownerId,
    );
    const ownerRoleRef = doc(firestore, "managerRoles", data.ownerId);
    const managerRoleRef = doc(firestore, "managerRoles", data.managerId);

    await assertSucceeds(
      runTransaction(firestore, async (transaction) => {
        await transaction.get(requestRef);
        await transaction.get(relationshipRef);
        await transaction.get(ownerRoleRef);
        await transaction.get(managerRoleRef);
        transaction.set(relationshipRef, managerRelationship());
        transaction.set(
          ownerRoleRef,
          managerRole(data.ownerId, "owner", data.managerId),
        );
        transaction.set(
          managerRoleRef,
          managerRole(data.managerId, "manager", data.ownerId),
        );
        transaction.delete(requestRef);
      }),
    );
  });

  test("ownerul nu poate crea direct relația de manager", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    await seedDocument("friendships", friendship().id, friendship());
    const alice = testEnv.authenticatedContext(ALICE_UID);

    await assertFails(
      setDoc(
        doc(alice.firestore(), "managerRelationships", ALICE_UID),
        managerRelationship(),
      ),
    );
  });

  test("managerul nu poate crea relația fără să consume cererea", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    await seedDocument("friendships", friendship().id, friendship());
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertFails(
      setDoc(
        doc(bob.firestore(), "managerRelationships", ALICE_UID),
        managerRelationship(),
      ),
    );
  });

  test("un rol nu poate fi creat în afara acceptării atomice", async () => {
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertFails(
      setDoc(
        doc(bob.firestore(), "managerRoles", BOB_UID),
        managerRole(BOB_UID, "manager", ALICE_UID),
      ),
    );
  });

  test("acceptarea este refuzată dacă managerul are deja un rol", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    await seedDocument("friendships", friendship().id, friendship());
    await seedDocument(
      "managerRoles",
      BOB_UID,
      managerRole(BOB_UID, "owner", OUTSIDER_UID),
    );
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();

    await assertFails(
      runTransaction(firestore, async (transaction) => {
        transaction.set(
          doc(firestore, "managerRelationships", ALICE_UID),
          managerRelationship(),
        );
        transaction.set(
          doc(firestore, "managerRoles", ALICE_UID),
          managerRole(ALICE_UID, "owner", BOB_UID),
        );
        transaction.set(
          doc(firestore, "managerRoles", BOB_UID),
          managerRole(BOB_UID, "manager", ALICE_UID),
        );
        transaction.delete(doc(firestore, "managerRequests", data.id));
      }),
    );
  });

  test("ownerul nu poate propune ca manager o persoană care nu este prieten", async () => {
    const data = managerRequest();
    const alice = testEnv.authenticatedContext(ALICE_UID);

    await assertFails(
      setDoc(
        doc(alice.firestore(), "managerRequests", data.id),
        data,
      ),
    );
  });

  test("o propunere de manager cu structură falsificată este refuzată", async () => {
    const data = { ...managerRequest(), extraPermission: true };
    await seedDocument("friendships", friendship().id, friendship());
    const alice = testEnv.authenticatedContext(ALICE_UID);

    await assertFails(
      setDoc(
        doc(alice.firestore(), "managerRequests", data.id),
        data,
      ),
    );
  });

  test("ownerul nu poate păstra două propuneri de manager active", async () => {
    const firstRequest = managerRequest();
    await seedDocument("managerRequests", firstRequest.id, firstRequest);
    await seedDocument("friendships", friendship().id, friendship());
    const alice = testEnv.authenticatedContext(ALICE_UID);

    await assertFails(
      setDoc(
        doc(alice.firestore(), "managerRequests", ALICE_UID),
        {
          ...firstRequest,
          managerId: OUTSIDER_UID,
          managerUsername: "outsider",
          memberIds: [ALICE_UID, OUTSIDER_UID],
        },
      ),
    );
  });

  test("managerul poate lista cererile primite", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    const bob = testEnv.authenticatedContext(BOB_UID);
    const incomingQuery = query(
      collection(bob.firestore(), "managerRequests"),
      where("managerId", "==", BOB_UID),
    );

    const snapshot = await assertSucceeds(getDocs(incomingQuery));

    expect(snapshot.docs).toHaveLength(1);
  });

  test("ownerul poate lista cererile trimise", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    const alice = testEnv.authenticatedContext(ALICE_UID);
    const outgoingQuery = query(
      collection(alice.firestore(), "managerRequests"),
      where("ownerId", "==", ALICE_UID),
    );

    const snapshot = await assertSucceeds(getDocs(outgoingQuery));

    expect(snapshot.docs).toHaveLength(1);
  });

  test("un utilizator nu poate lista cererile de manager ale altcuiva", async () => {
    const data = managerRequest();
    await seedDocument("managerRequests", data.id, data);
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);
    const otherUserRequestsQuery = query(
      collection(outsider.firestore(), "managerRequests"),
      where("managerId", "==", BOB_UID),
    );

    await assertFails(getDocs(otherUserRequestsQuery));
  });

  test("un participant poate verifica o relație inexistentă înainte de creare", async () => {
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertSucceeds(
      getDoc(doc(bob.firestore(), "managerRelationships", ALICE_UID)),
    );
  });

  test("un participant poate lista relațiile de manager care îl conțin", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    const bob = testEnv.authenticatedContext(BOB_UID);
    const relationshipsQuery = query(
      collection(bob.firestore(), "managerRelationships"),
      where("memberIds", "array-contains", BOB_UID),
    );

    const snapshot = await assertSucceeds(getDocs(relationshipsQuery));

    expect(snapshot.docs).toHaveLength(1);
  });

  test("managerul poate lista profilurile pe care le gestionează", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    const bob = testEnv.authenticatedContext(BOB_UID);
    const managedProfilesQuery = query(
      collection(bob.firestore(), "managerRelationships"),
      where("managerId", "==", BOB_UID),
    );

    const snapshot = await assertSucceeds(getDocs(managedProfilesQuery));

    expect(snapshot.docs).toHaveLength(1);
  });

  test("un utilizator nu poate lista profilurile gestionate de altcineva", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);
    const managedProfilesQuery = query(
      collection(outsider.firestore(), "managerRelationships"),
      where("managerId", "==", BOB_UID),
    );

    await assertFails(getDocs(managedProfilesQuery));
  });

  test("numai ownerul sau managerul pot elimina relația", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    await seedDocument(
      "managerRoles",
      ALICE_UID,
      managerRole(ALICE_UID, "owner", BOB_UID),
    );
    await seedDocument(
      "managerRoles",
      BOB_UID,
      managerRole(BOB_UID, "manager", ALICE_UID),
    );
    const outsider = testEnv.authenticatedContext(OUTSIDER_UID);

    await assertFails(
      deleteDoc(
        doc(outsider.firestore(), "managerRelationships", ALICE_UID),
      ),
    );

    const bob = testEnv.authenticatedContext(BOB_UID);
    await assertSucceeds(runTransaction(bob.firestore(), async (transaction) => {
      transaction.delete(
        doc(bob.firestore(), "managerRelationships", ALICE_UID),
      );
      transaction.delete(doc(bob.firestore(), "managerRoles", ALICE_UID));
      transaction.delete(doc(bob.firestore(), "managerRoles", BOB_UID));
    }));
  });
});

describe("Regulile datelor din feed", () => {
  beforeEach(async () => {
    await seedDocument(
      "managerRoles",
      ALICE_UID,
      managerRole(ALICE_UID, "owner", BOB_UID),
    );
    await seedDocument(
      "managerRoles",
      BOB_UID,
      managerRole(BOB_UID, "manager", ALICE_UID),
    );
  });

  test("managerul activ poate verifica rolul unui candidat", async () => {
    await seedDocument(
      "managerRoles",
      OUTSIDER_UID,
      managerRole(OUTSIDER_UID, "owner", "candidate-manager"),
    );
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertSucceeds(
      getDoc(doc(bob.firestore(), "managerRoles", OUTSIDER_UID)),
    );

    const alice = testEnv.authenticatedContext(ALICE_UID);
    await assertFails(
      getDoc(doc(alice.firestore(), "managerRoles", OUTSIDER_UID)),
    );
  });

  test("managerul poate calcula prietenii comuni, dar un outsider nu", async () => {
    await seedDocument("friendships", "candidate_friend", {
      id: "candidate_friend",
      memberIds: [OUTSIDER_UID, "friend-uid"],
      memberUsernames: ["outsider", "friend"],
      createdAt: "2026-08-15T10:00:00.000Z",
    });
    const bob = testEnv.authenticatedContext(BOB_UID);
    const candidateFriendsQuery = query(
      collection(bob.firestore(), "friendships"),
      where("memberIds", "array-contains", OUTSIDER_UID),
    );

    const snapshot = await assertSucceeds(getDocs(candidateFriendsQuery));
    expect(snapshot.docs).toHaveLength(1);

    const unaffiliated = testEnv.authenticatedContext("unaffiliated-uid");
    const forbiddenQuery = query(
      collection(unaffiliated.firestore(), "friendships"),
      where("memberIds", "array-contains", OUTSIDER_UID),
    );
    await assertFails(getDocs(forbiddenQuery));
  });

  test("numai managerul ownerului poate lista reacțiile și match-urile", async () => {
    await seedDocument("reactions", `${ALICE_UID}_${OUTSIDER_UID}`, {
      id: `${ALICE_UID}_${OUTSIDER_UID}`,
      ownerId: ALICE_UID,
      targetId: OUTSIDER_UID,
      actorId: BOB_UID,
      actorRole: "manager",
      value: "like",
      createdAt: "2026-08-15T10:00:00.000Z",
      updatedAt: "2026-08-15T10:00:00.000Z",
    });
    await seedDocument("matches", `${ALICE_UID}_${OUTSIDER_UID}`, {
      id: `${ALICE_UID}_${OUTSIDER_UID}`,
      memberIds: [ALICE_UID, OUTSIDER_UID],
      createdAt: "2026-08-15T10:00:00.000Z",
    });
    const bob = testEnv.authenticatedContext(BOB_UID);

    await assertSucceeds(getDocs(query(
      collection(bob.firestore(), "reactions"),
      where("ownerId", "==", ALICE_UID),
    )));
    await assertSucceeds(getDocs(query(
      collection(bob.firestore(), "matches"),
      where("memberIds", "array-contains", ALICE_UID),
    )));

    const alice = testEnv.authenticatedContext(ALICE_UID);
    await assertFails(getDocs(query(
      collection(alice.firestore(), "reactions"),
      where("ownerId", "==", ALICE_UID),
    )));
    await assertFails(getDocs(query(
      collection(alice.firestore(), "matches"),
      where("memberIds", "array-contains", ALICE_UID),
    )));
  });

  test("managerul poate salva reacția prin tranzacția folosită de feed", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    await seedDocument(
      "managerRoles",
      OUTSIDER_UID,
      managerRole(OUTSIDER_UID, "owner", "candidate-manager"),
    );
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();
    const reactionId = `${ALICE_UID}_${OUTSIDER_UID}`;
    const reverseReactionId = `${OUTSIDER_UID}_${ALICE_UID}`;
    const reactionRef = doc(firestore, "reactions", reactionId);
    const reverseReactionRef = doc(
      firestore,
      "reactions",
      reverseReactionId,
    );
    const matchRef = doc(firestore, "matches", reactionId);

    await assertSucceeds(runTransaction(firestore, async (transaction) => {
      await transaction.get(
        doc(firestore, "managerRelationships", ALICE_UID),
      );
      await transaction.get(doc(firestore, "managerRoles", OUTSIDER_UID));
      await transaction.get(reactionRef);
      await transaction.get(reverseReactionRef);
      await transaction.get(matchRef);
      transaction.set(reactionRef, {
        id: reactionId,
        ownerId: ALICE_UID,
        targetId: OUTSIDER_UID,
        actorId: BOB_UID,
        actorRole: "manager",
        value: "dislike",
        createdAt: "2026-08-19T12:00:00.000Z",
        updatedAt: "2026-08-19T12:00:00.000Z",
        expiresAt: "2026-09-18T12:00:00.000Z",
      });
    }));

    expect((await getDoc(reactionRef)).exists()).toBe(true);
  });

  test("like-ul reciproc poate crea atomic un singur match", async () => {
    await seedDocument(
      "managerRelationships",
      ALICE_UID,
      managerRelationship(),
    );
    await seedDocument(
      "managerRoles",
      OUTSIDER_UID,
      managerRole(OUTSIDER_UID, "owner", "candidate-manager"),
    );
    await seedDocument("reactions", `${OUTSIDER_UID}_${ALICE_UID}`, {
      id: `${OUTSIDER_UID}_${ALICE_UID}`,
      ownerId: OUTSIDER_UID,
      targetId: ALICE_UID,
      actorId: "candidate-manager",
      actorRole: "manager",
      value: "like",
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
    });
    const bob = testEnv.authenticatedContext(BOB_UID);
    const firestore = bob.firestore();
    const reactionId = `${ALICE_UID}_${OUTSIDER_UID}`;
    const reverseReactionId = `${OUTSIDER_UID}_${ALICE_UID}`;
    const reactionRef = doc(firestore, "reactions", reactionId);
    const matchRef = doc(firestore, "matches", reactionId);

    await assertSucceeds(runTransaction(firestore, async (transaction) => {
      await transaction.get(
        doc(firestore, "managerRelationships", ALICE_UID),
      );
      await transaction.get(doc(firestore, "managerRoles", OUTSIDER_UID));
      await transaction.get(reactionRef);
      await transaction.get(
        doc(firestore, "reactions", reverseReactionId),
      );
      await transaction.get(matchRef);
      transaction.set(reactionRef, {
        id: reactionId,
        ownerId: ALICE_UID,
        targetId: OUTSIDER_UID,
        actorId: BOB_UID,
        actorRole: "manager",
        value: "like",
        createdAt: "2026-08-19T12:00:00.000Z",
        updatedAt: "2026-08-19T12:00:00.000Z",
      });
      transaction.set(matchRef, {
        id: reactionId,
        memberIds: [ALICE_UID, OUTSIDER_UID],
        createdAt: "2026-08-19T12:00:00.000Z",
      });
    }));

    expect((await getDoc(matchRef)).exists()).toBe(true);
  });
});
