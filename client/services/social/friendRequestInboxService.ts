import type {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase/firestore";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import type { FriendRequest, Friendship } from "../../types/social";
import { db } from "../firebase";
import { createPairId } from "./socialIds";

const FRIEND_REQUESTS_COLLECTION = "friendRequests";
const FRIENDSHIPS_COLLECTION = "friendships";

type RequestRole = "sender" | "receiver";

function mapFriendRequest(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): FriendRequest {
  return {
    ...(snapshot.data() as Omit<FriendRequest, "id">),
    id: snapshot.id,
  };
}

async function getPendingFriendRequestsForMember(
  uid: string,
): Promise<FriendRequest[]> {
  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where("memberIds", "array-contains", uid),
  );
  const snapshot = await getDocs(requestsQuery);

  return snapshot.docs
    .map(mapFriendRequest)
    .filter((request) => request.status === "pending")
    .sort((requestA, requestB) =>
      requestB.createdAt.localeCompare(requestA.createdAt),
    );
}

async function getPendingRequestInTransaction(
  transaction: Transaction,
  requestRef: DocumentReference<DocumentData>,
): Promise<FriendRequest> {
  const snapshot = await transaction.get(requestRef);

  if (!snapshot.exists()) {
    throw new Error("FRIEND_REQUEST_NOT_FOUND");
  }

  const request: FriendRequest = {
    ...(snapshot.data() as Omit<FriendRequest, "id">),
    id: snapshot.id,
  };

  if (request.status !== "pending") {
    throw new Error("FRIEND_REQUEST_NOT_PENDING");
  }

  if (
    !request.senderId ||
    !request.receiverId ||
    !request.senderUsername ||
    !request.receiverUsername
  ) {
    throw new Error("INVALID_FRIEND_REQUEST");
  }

  return request;
}

function getSortedMembers(request: FriendRequest): {
  memberIds: [string, string];
  memberUsernames: [string, string];
} {
  const members = [
    { uid: request.senderId, username: request.senderUsername },
    { uid: request.receiverId, username: request.receiverUsername },
  ].sort((memberA, memberB) => memberA.uid.localeCompare(memberB.uid));

  return {
    memberIds: [members[0].uid, members[1].uid],
    memberUsernames: [members[0].username, members[1].username],
  };
}

async function deletePendingRequestForRole(
  requestId: string,
  currentUid: string,
  requiredRole: RequestRole,
): Promise<void> {
  const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async (transaction) => {
    const request = await getPendingRequestInTransaction(
      transaction,
      requestRef,
    );
    const participantId =
      requiredRole === "receiver" ? request.receiverId : request.senderId;

    if (participantId !== currentUid) {
      throw new Error(
        requiredRole === "receiver"
          ? "ONLY_RECEIVER_CAN_RESPOND"
          : "ONLY_SENDER_CAN_CANCEL",
      );
    }

    transaction.delete(requestRef);
  });
}

export async function getIncomingFriendRequests(
  uid: string,
): Promise<FriendRequest[]> {
  const requests = await getPendingFriendRequestsForMember(uid);

  return requests.filter((request) => request.receiverId === uid);
}

export async function getOutgoingFriendRequests(
  uid: string,
): Promise<FriendRequest[]> {
  const requests = await getPendingFriendRequestsForMember(uid);

  return requests.filter((request) => request.senderId === uid);
}

export async function acceptFriendRequest(
  requestId: string,
  currentUid: string,
): Promise<void> {
  const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
  const acceptedAt = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const request = await getPendingRequestInTransaction(
      transaction,
      requestRef,
    );

    if (request.receiverId !== currentUid) {
      throw new Error("ONLY_RECEIVER_CAN_RESPOND");
    }

    const friendshipId = createPairId(
      request.senderId,
      request.receiverId,
    );
    const friendshipRef = doc(
      db,
      FRIENDSHIPS_COLLECTION,
      friendshipId,
    );
    const { memberIds, memberUsernames } = getSortedMembers(request);
    const friendship: Friendship = {
      id: friendshipId,
      memberIds,
      memberUsernames,
      createdAt: acceptedAt,
    };

    transaction.set(friendshipRef, friendship);
    transaction.delete(requestRef);
  });
}

export async function declineFriendRequest(
  requestId: string,
  currentUid: string,
): Promise<void> {
  await deletePendingRequestForRole(requestId, currentUid, "receiver");
}

export async function cancelFriendRequest(
  requestId: string,
  currentUid: string,
): Promise<void> {
  await deletePendingRequestForRole(requestId, currentUid, "sender");
}
