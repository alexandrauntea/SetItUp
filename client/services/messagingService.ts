import { db } from "@/services/firebase";
import type { Conversation, Message, UserBlock } from "@/types/messaging";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_SUBCOLLECTION = "messages";
const BLOCKS_COLLECTION = "blocks";

function generateMessageId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createConversationForMatch(
  matchId: string,
  memberIds: [string, string],
  managerIds: [string, string],
): Promise<void> {
  const convRef = doc(db, CONVERSATIONS_COLLECTION, matchId);
  const snap = await getDoc(convRef);

  if (snap.exists()) {
    return;
  }

  const nowIso = new Date().toISOString();
  const newConversation: Conversation = {
    id: matchId,
    matchId,
    memberIds,
    managerIds,
    blockedBy: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(convRef, newConversation);
}

export async function getConversationsForManager(
  managerId: string,
): Promise<Conversation[]> {
  const convsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(convsRef, where("managerIds", "array-contains", managerId));
  const snapshot = await getDocs(q);

  const conversations = snapshot.docs.map(
    (docSnap) => docSnap.data() as Conversation,
  );

  return conversations.sort((a, b) =>
    (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
  );
}

export function subscribeToConversations(
  managerId: string,
  callback: (conversations: Conversation[]) => void,
): () => void {
  const convsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(convsRef, where("managerIds", "array-contains", managerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map(
        (docSnap) => docSnap.data() as Conversation,
      );
      const sorted = conversations.sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
      );
      callback(sorted);
    },
    (error) => {
      console.info("Eroare la ascultarea conversațiilor:", error);
    },
  );
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
): () => void {
  const messagesRef = collection(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION,
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(
        (docSnap) => docSnap.data() as Message,
      );
      callback(messages);
    },
    (error) => {
      console.info("Eroare la ascultarea mesajelor:", error);
    },
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("INVALID_MESSAGE_TEXT");
  }

  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const msgId = generateMessageId();
  const msgRef = doc(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION,
    msgId,
  );

  const nowIso = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const convSnap = await transaction.get(convRef);
    if (!convSnap.exists()) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    const data = convSnap.data() as Conversation;
    if (data.blockedBy) {
      throw new Error("CONVERSATION_BLOCKED");
    }

    const message: Message = {
      id: msgId,
      conversationId,
      senderId,
      senderRole: "manager",
      text: trimmedText,
      createdAt: nowIso,
    };

    transaction.set(msgRef, message);
    transaction.update(convRef, {
      lastMessage: trimmedText,
      lastMessageAt: nowIso,
      lastMessageSenderId: senderId,
      updatedAt: nowIso,
    });
  });
}

export async function blockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const nowIso = new Date().toISOString();

  const userBlock: UserBlock = {
    id: blockId,
    blockerId,
    blockedId,
    createdAt: nowIso,
  };

  await runTransaction(db, async (transaction) => {
    transaction.set(blockRef, userBlock);
    transaction.update(convRef, {
      blockedBy: blockerId,
      updatedAt: nowIso,
    });
  });
}

export async function unblockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    transaction.delete(blockRef);
    transaction.update(convRef, {
      blockedBy: null,
      updatedAt: nowIso,
    });
  });
}

export async function isConversationBlocked(
  conversationId: string,
): Promise<boolean> {
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);

  if (!convSnap.exists()) {
    return false;
  }

  const data = convSnap.data() as Conversation;
  return Boolean(data.blockedBy);
}
