import { db } from "@/services/firebase";
import { areFriends } from "@/services/social/friendshipService";
import {
  createManagerRequestId,
  createPairId,
} from "@/services/social/socialIds";
import type {
  Friendship,
  ManagerRelationship,
  ManagerRequest,
} from "@/types/social";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";

const MANAGER_REQUESTS_COLLECTION = "managerRequests";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";
const FRIENDSHIPS_COLLECTION = "friendships";

async function getFriendUsernames(
  ownerId: string,
  managerId: string,
): Promise<{ ownerUsername: string; managerUsername: string }> {
  const friendshipRef = doc(
    db,
    FRIENDSHIPS_COLLECTION,
    createPairId(ownerId, managerId),
  );
  const friendshipSnapshot = await getDoc(friendshipRef);

  if (!friendshipSnapshot.exists()) {
    throw new Error("NOT_FRIENDS");
  }

  const friendship = friendshipSnapshot.data() as Friendship;
  const ownerIndex = friendship.memberIds.indexOf(ownerId);
  const managerIndex = friendship.memberIds.indexOf(managerId);
  const ownerUsername = friendship.memberUsernames[ownerIndex];
  const managerUsername = friendship.memberUsernames[managerIndex];

  if (
    ownerIndex === -1 ||
    managerIndex === -1 ||
    !ownerUsername?.trim() ||
    !managerUsername?.trim()
  ) {
    throw new Error("INVALID_FRIENDSHIP_DATA");
  }

  return { ownerUsername, managerUsername };
}

export async function sendManagerRequest(
  ownerId: string,
  managerId: string
): Promise<void> {
  if (ownerId === managerId) {
    throw new Error("CANNOT_MANAGE_SELF");
  }

  const friends = await areFriends(ownerId, managerId);
  if (!friends) {
    throw new Error("NOT_FRIENDS");
  }

  const existingRelationship = await getManagerRelationship(ownerId);
  if (existingRelationship) {
    throw new Error("ALREADY_HAS_MANAGER");
  }

  // Un document per owner garantează că nu pot exista două propuneri active,
  // nici dacă cererile sunt trimise simultan de pe dispozitive diferite.
  const requestId = createManagerRequestId(ownerId);
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);
  if (requestSnap.exists()) {
    throw new Error("REQUEST_ALREADY_EXISTS");
  }

  const { ownerUsername, managerUsername } = await getFriendUsernames(
    ownerId,
    managerId,
  );

  const now = new Date().toISOString();
  const managerRequestData: ManagerRequest = {
    id: requestId,
    ownerId,
    ownerUsername,
    managerId,
    managerUsername,
    memberIds: [ownerId, managerId],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(requestRef, managerRequestData);
}

export async function getIncomingManagerRequests(
  uid: string
): Promise<ManagerRequest[]> {
  const requestsRef = collection(db, MANAGER_REQUESTS_COLLECTION);
  const requestsQuery = query(
    requestsRef,
    where("managerId", "==", uid)
  );

  const snapshot = await getDocs(requestsQuery);
  const requests = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ManagerRequest[];

  return requests
    .filter((request) => request.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOutgoingManagerRequests(
  uid: string
): Promise<ManagerRequest[]> {
  const requestsRef = collection(db, MANAGER_REQUESTS_COLLECTION);
  const requestsQuery = query(
    requestsRef,
    where("ownerId", "==", uid)
  );

  const snapshot = await getDocs(requestsQuery);
  const requests = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ManagerRequest[];

  return requests
    .filter((request) => request.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function acceptManagerRequest(
  requestId: string,
  currentUid: string
): Promise<void> {
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const requestData = requestSnapshot.data() as ManagerRequest;

    if (requestData.status !== "pending") {
      throw new Error("REQUEST_NOT_PENDING");
    }

    if (requestData.managerId !== currentUid) {
      throw new Error("UNAUTHORIZED");
    }

    const relationshipRef = doc(
      db,
      MANAGER_RELATIONSHIPS_COLLECTION,
      requestData.ownerId,
    );
    const relSnap = await transaction.get(relationshipRef);

    if (relSnap.exists()) {
      throw new Error("ALREADY_HAS_MANAGER");
    }

    const now = new Date().toISOString();
    const newRelationship: ManagerRelationship = {
      ownerId: requestData.ownerId,
      ownerUsername: requestData.ownerUsername,
      managerId: requestData.managerId,
      managerUsername: requestData.managerUsername,
      memberIds: [requestData.ownerId, requestData.managerId],
      createdAt: now,
    };

    transaction.set(relationshipRef, newRelationship);
    transaction.delete(requestRef);
  });
}

export async function declineManagerRequest(
  requestId: string,
  currentUid: string
): Promise<void> {
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    return;
  }

  const requestData = requestSnap.data() as ManagerRequest;

  if (
    requestData.managerId !== currentUid &&
    requestData.ownerId !== currentUid
  ) {
    throw new Error("UNAUTHORIZED");
  }

  await deleteDoc(requestRef);
}

export async function getManagerRelationship(
  ownerId: string
): Promise<ManagerRelationship | null> {
  const relRef = doc(db, MANAGER_RELATIONSHIPS_COLLECTION, ownerId);
  const relSnap = await getDoc(relRef);

  if (!relSnap.exists()) {
    return null;
  }

  return {
    ...relSnap.data(),
  } as ManagerRelationship;
}

export async function getManagedProfiles(
  managerId: string,
): Promise<ManagerRelationship[]> {
  const relationshipsRef = collection(db, MANAGER_RELATIONSHIPS_COLLECTION);
  const relationshipsQuery = query(
    relationshipsRef,
    where("managerId", "==", managerId),
  );
  const snapshot = await getDocs(relationshipsQuery);

  return snapshot.docs
    .map((documentSnapshot) => documentSnapshot.data() as ManagerRelationship)
    .sort((relationshipA, relationshipB) =>
      relationshipB.createdAt.localeCompare(relationshipA.createdAt),
    );
}

export async function isManagerForUser(
  managerId: string,
  ownerId: string
): Promise<boolean> {
  const rel = await getManagerRelationship(ownerId);
  return rel !== null && rel.managerId === managerId;
}

export async function removeManager(
  ownerId: string,
  currentUid: string
): Promise<void> {
  const relRef = doc(db, MANAGER_RELATIONSHIPS_COLLECTION, ownerId);
  const relSnap = await getDoc(relRef);

  if (!relSnap.exists()) {
    return;
  }

  const relData = relSnap.data() as ManagerRelationship;

  if (currentUid !== relData.ownerId && currentUid !== relData.managerId) {
    throw new Error("UNAUTHORIZED");
  }

  await deleteDoc(relRef);
}
