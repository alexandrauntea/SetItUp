import { db } from "@/services/firebase";
import { createPairId } from "@/services/social/socialIds";
import type { FriendRequest } from "@/types/social";
import { doc, runTransaction } from "firebase/firestore";

const FRIENDSHIPS_COLLECTION = "friendships";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";

export type SendFriendRequestInput = {
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
};

export async function sendFriendRequest(
  input: SendFriendRequestInput,
): Promise<FriendRequest> {
  const senderId = input.senderId.trim();
  const receiverId = input.receiverId.trim();
  const senderUsername = input.senderUsername.trim().toLowerCase();
  const receiverUsername = input.receiverUsername.trim().toLowerCase();

  if (!senderId || !receiverId || !senderUsername || !receiverUsername) {
    throw new Error("INVALID_FRIEND_REQUEST_INPUT");
  }

  if (senderId === receiverId) {
    throw new Error("CANNOT_SEND_REQUEST_TO_SELF");
  }

  const pairId = createPairId(senderId, receiverId);
  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, pairId);
  const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, pairId);

  return runTransaction(db, async (transaction) => {
    const friendshipSnapshot = await transaction.get(friendshipRef);
    const requestSnapshot = await transaction.get(requestRef);

    if (friendshipSnapshot.exists()) {
      throw new Error("ALREADY_FRIENDS");
    }

    if (requestSnapshot.exists()) {
      throw new Error("FRIEND_REQUEST_ALREADY_EXISTS");
    }

    const now = new Date().toISOString();
    const request: FriendRequest = {
      id: pairId,
      senderId,
      senderUsername,
      receiverId,
      receiverUsername,
      memberIds: [senderId, receiverId],
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(requestRef, request);
    return request;
  });
}
