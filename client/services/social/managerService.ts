import { db } from "@/services/firebase";
import { areFriends } from "@/services/social/friendshipService";
import { createManagerRequestId } from "@/services/social/socialIds";
import { ManagerRelationship, ManagerRequest } from "@/types/social";
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

async function getUsernameForUid(uid: string): Promise<string> {
  try {
    const publicRef = doc(db, "publicProfiles", uid);
    const publicSnap = await getDoc(publicRef);
    if (publicSnap.exists() && publicSnap.data()?.username) {
      return publicSnap.data().username as string;
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data()?.username) {
      return userSnap.data().username as string;
    }
  } catch (error) {
    console.error("Error fetching username for uid:", uid, error);
  }
  return "Utilizator";
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

  const requestId = createManagerRequestId(ownerId, managerId);
  const requestRef = doc(db, MANAGER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);
  if (requestSnap.exists()) {
    throw new Error("REQUEST_ALREADY_EXISTS");
  }

  const ownerUsername = await getUsernameForUid(ownerId);
  const managerUsername = await getUsernameForUid(managerId);

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
  const q = query(
    requestsRef,
    where("managerId", "==", uid),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ManagerRequest[];
}

export async function getOutgoingManagerRequests(
  uid: string
): Promise<ManagerRequest[]> {
  const requestsRef = collection(db, MANAGER_REQUESTS_COLLECTION);
  const q = query(
    requestsRef,
    where("ownerId", "==", uid),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ManagerRequest[];
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
  const relRef = doc(db, MANAGER_RELATIONSHIPS_COLLECTION, ownerId);
  const relSnap = await getDoc(relRef);

  if (!relSnap.exists()) {
    return null;
  }

  return {
    ...relSnap.data(),
  } as ManagerRelationship;
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
