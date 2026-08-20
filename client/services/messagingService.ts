import { auth, db } from "@/services/firebase";
import type { Conversation, Message } from "@/types/messaging";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  type Unsubscribe,
} from "firebase/firestore";

const CONVERSATIONS_COLLECTION = "conversations";
const BLOCKS_COLLECTION = "blocks";

function requireText(value: string): string {
  const text = value.trim();
  if (!text) throw new Error("EMPTY_MESSAGE");
  if (text.length > 2_000) throw new Error("MESSAGE_TOO_LONG");
  return text;
}

function blockId(blockerId: string, blockedId: string): string {
  return `${blockerId}_${blockedId}`;
}

export function subscribeToConversation(
  conversationId: string,
  callback: (conversation: Conversation | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, CONVERSATIONS_COLLECTION, conversationId),
    (snapshot) => {
      callback(
        snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as Conversation)
          : null,
      );
    },
    (error) => onError?.(error),
  );
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) =>
      callback(
        snapshot.docs.map((messageDocument) => ({
          id: messageDocument.id,
          ...messageDocument.data(),
        })) as Message[],
      ),
    (error) => onError?.(error),
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  value: string,
): Promise<void> {
  if (auth.currentUser?.uid !== senderId) throw new Error("UNAUTHORIZED");
  const text = requireText(value);
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const messageRef = doc(collection(conversationRef, "messages"));

  await runTransaction(db, async (transaction) => {
    const conversationSnapshot = await transaction.get(conversationRef);
    if (!conversationSnapshot.exists()) throw new Error("CONVERSATION_NOT_FOUND");

    const conversation = conversationSnapshot.data() as Conversation;
    if (!conversation.managerIds.includes(senderId)) throw new Error("UNAUTHORIZED");
    if (conversation.blockedBy) throw new Error("CONVERSATION_BLOCKED");

    const now = new Date().toISOString();
    const message: Message = {
      id: messageRef.id,
      conversationId,
      senderId,
      senderRole: "manager",
      text,
      createdAt: now,
    };
    transaction.set(messageRef, message);
    transaction.update(conversationRef, {
      lastMessage: text,
      lastMessageAt: now,
      lastMessageSenderId: senderId,
      updatedAt: now,
    });
  });
}

export async function blockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (auth.currentUser?.uid !== blockerId) throw new Error("UNAUTHORIZED");
  const now = new Date().toISOString();
  await runTransaction(db, async (transaction) => {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const snapshot = await transaction.get(conversationRef);
    if (!snapshot.exists()) throw new Error("CONVERSATION_NOT_FOUND");
    const conversation = snapshot.data() as Conversation;
    if (!conversation.managerIds.includes(blockerId) || !conversation.managerIds.includes(blockedId)) {
      throw new Error("UNAUTHORIZED");
    }
    transaction.set(doc(db, BLOCKS_COLLECTION, blockId(blockerId, blockedId)), {
      id: blockId(blockerId, blockedId),
      blockerId,
      blockedId,
      createdAt: now,
    });
    transaction.update(conversationRef, { blockedBy: blockerId, updatedAt: now });
  });
}

export async function unblockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (auth.currentUser?.uid !== blockerId) throw new Error("UNAUTHORIZED");
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    if (!snapshot.exists()) throw new Error("CONVERSATION_NOT_FOUND");
    const conversation = snapshot.data() as Conversation;
    if (conversation.blockedBy !== blockerId) throw new Error("UNAUTHORIZED");
    transaction.update(conversationRef, {
      blockedBy: null,
      updatedAt: new Date().toISOString(),
    });
    transaction.delete(doc(db, BLOCKS_COLLECTION, blockId(blockerId, blockedId)));
  });
}

export async function isConversationBlocked(conversationId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const unsubscribe = subscribeToConversation(
      conversationId,
      (conversation) => {
        unsubscribe();
        resolve(Boolean(conversation?.blockedBy));
      },
      reject,
    );
  });
}
