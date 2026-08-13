import { db } from "@/services/firebase";
import { areFriends } from "@/services/social/friendshipService";
import { createManagerRequestId, createPairId } from "@/services/social/socialIds";
import { Friendship, ManagerRelationship, ManagerRequest } from "@/types/social";
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

  const requestId = createManagerRequestId(ownerId, managerId);
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);
  if (requestSnap.exists()) {
    throw new Error("REQUEST_ALREADY_EXISTS");
  }

  // Get usernames directly from friendship document where they are stored
  const pairId = createPairId(ownerId, managerId);
  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, pairId);
  const friendshipSnap = await getDoc(friendshipRef);

  let ownerUsername = "Utilizator";
  let managerUsername = "Utilizator";

  if (friendshipSnap.exists()) {
    const friendshipData = friendshipSnap.data() as Friendship;
    const ownerIndex = friendshipData.memberIds.indexOf(ownerId);
    const managerIndex = friendshipData.memberIds.indexOf(managerId);

    if (ownerIndex !== -1 && friendshipData.memberUsernames?.[ownerIndex]) {
      ownerUsername = friendshipData.memberUsernames[ownerIndex];
    }
    if (managerIndex !== -1 && friendshipData.memberUsernames?.[managerIndex]) {
      managerUsername = friendshipData.memberUsernames[managerIndex];
    }
  }

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
  try {
    const requestsRef = collection(db, MANAGER_REQUESTS_COLLECTION);
    const q = query(
      requestsRef,
      where("memberIds", "array-contains", uid)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }) as ManagerRequest)
      .filter((req) => req.managerId === uid && req.status === "pending");
  } catch (error) {
    console.warn("Firestore info (getIncomingManagerRequests):", error);
    return [];
  }
}

export async function getOutgoingManagerRequests(
  uid: string
): Promise<ManagerRequest[]> {
  try {
    const requestsRef = collection(db, MANAGER_REQUESTS_COLLECTION);
    const q = query(
      requestsRef,
      where("memberIds", "array-contains", uid)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }) as ManagerRequest)
      .filter((req) => req.ownerId === uid && req.status === "pending");
  } catch (error) {
    console.warn("Firestore info (getOutgoingManagerRequests):", error);
    return [];
  }
}

export async function acceptManagerRequest(
  requestId: string,
  currentUid: string
): Promise<void> {
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  const requestData = requestSnap.data() as ManagerRequest;

  if (requestData.managerId !== currentUid) {
    throw new Error("UNAUTHORIZED");
  }

  const relationshipRef = doc(
    db,
    MANAGER_RELATIONSHIPS_COLLECTION,
    requestData.ownerId
  );

  await runTransaction(db, async (transaction) => {
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
  try {
    const relRef = doc(db, MANAGER_RELATIONSHIPS_COLLECTION, ownerId);
    const relSnap = await getDoc(relRef);

    if (!relSnap.exists()) {
      return null;
    }

    return {
      ...relSnap.data(),
    } as ManagerRelationship;
  } catch (error) {
    console.warn("Firestore info (getManagerRelationship):", error);
    return null;
  }
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
