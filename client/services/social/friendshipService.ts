import { db } from "@/services/firebase";
import { createPairId } from "@/services/social/socialIds";
import { Friendship } from "@/types/social";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    writeBatch,
} from "firebase/firestore";

const FRIENDSHIPS_COLLECTION = "friendships";
const MANAGER_REQUESTS_COLLECTION = "managerRequests";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";

export async function getFriends(uid: string): Promise<Friendship[]> {
  const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);

  const q = query(
    friendshipsRef,
    where("memberIds", "array-contains", uid),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((friendshipDoc) => ({
    id: friendshipDoc.id,
    ...friendshipDoc.data(),
  })) as Friendship[];
}

export async function areFriends(
  uidA: string,
  uidB: string,
): Promise<boolean> {
  if (uidA === uidB) {
    return false;
  }

  const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);

  const q = query(
    friendshipsRef,
    where("memberIds", "array-contains", uidA),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.some((friendshipDoc) => {
    const memberIds = friendshipDoc.data().memberIds as string[];

    return memberIds.includes(uidB);
  });
}

export async function removeFriend(
  currentUid: string,
  friendUid: string,
): Promise<void> {
  if (currentUid === friendUid) {
    throw new Error("INVALID_FRIENDSHIP");
  }

  const batch = writeBatch(db);

  const friendshipRef = doc(
    db,
    FRIENDSHIPS_COLLECTION,
    createPairId(currentUid, friendUid),
  );

  batch.delete(friendshipRef);

  const managerRequestsRef = collection(
    db,
    MANAGER_REQUESTS_COLLECTION,
  );

  const managerRequestsQuery = query(
    managerRequestsRef,
    where("memberIds", "array-contains", currentUid),
  );

  const managerRequestsSnapshot = await getDocs(managerRequestsQuery);

  for (const requestDoc of managerRequestsSnapshot.docs) {
    const memberIds = requestDoc.data().memberIds as string[];

    if (memberIds.includes(friendUid)) {
      batch.delete(requestDoc.ref);
    }
  }

  const managerRelationshipsRef = collection(
    db,
    MANAGER_RELATIONSHIPS_COLLECTION,
  );

  const managerRelationshipsQuery = query(
    managerRelationshipsRef,
    where("memberIds", "array-contains", currentUid),
  );

  const managerRelationshipsSnapshot = await getDocs(
    managerRelationshipsQuery,
  );

  for (const relationshipDoc of managerRelationshipsSnapshot.docs) {
    const memberIds = relationshipDoc.data().memberIds as string[];

    if (memberIds.includes(friendUid)) {
      batch.delete(relationshipDoc.ref);
    }
  }

  await batch.commit();
}