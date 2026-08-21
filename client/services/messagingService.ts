import { db } from "@/services/firebase";
import type { Conversation, Message, UserBlock } from "@/types/messaging";
import {
  collection, doc, getDoc, getDocs, onSnapshot, orderBy, query,
  runTransaction, setDoc, type Unsubscribe, where,
} from "firebase/firestore";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_SUBCOLLECTION = "messages";
const BLOCKS_COLLECTION = "blocks";

function generateMessageId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function blockDocumentId(blockerId: string, blockedId: string): string {
  return `${blockerId}_${blockedId}`;
}

export async function ensureConversationsForManager(managerId: string): Promise<void> {
  try {
    const relationships = await getDocs(query(
      collection(db, "managerRelationships"),
      where("managerId", "==", managerId),
    ));
    if (!relationships?.docs || relationships.empty) return;

    for (const relationship of relationships.docs) {
      const ownerId = relationship.data()?.ownerId;
      if (!ownerId) continue;
      const matches = await getDocs(query(
        collection(db, "matches"),
        where("memberIds", "array-contains", ownerId),
      ));
      if (!matches?.docs || matches.empty) continue;

      for (const match of matches.docs) {
        const matchData = match.data();
        if (!Array.isArray(matchData?.memberIds)) continue;
        const conversationRef = doc(db, CONVERSATIONS_COLLECTION, match.id);
        const conversation = await getDoc(conversationRef);
        if (conversation?.exists()) continue;

        const memberIds = matchData.memberIds as [string, string];
        const otherOwnerId = memberIds.find((id) => id !== ownerId);
        let otherManagerId = "";
        if (otherOwnerId) {
          const otherRelationship = await getDoc(doc(db, "managerRelationships", otherOwnerId));
          if (otherRelationship?.exists()) {
            otherManagerId = otherRelationship.data()?.managerId || "";
          }
        }

        const managerIds = [managerId, otherManagerId || managerId].sort() as [string, string];
        const now = matchData.createdAt || new Date().toISOString();
        await setDoc(conversationRef, {
          id: match.id,
          matchId: match.id,
          memberIds,
          managerIds,
          blockedBy: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    console.info("Nu s-au putut sincroniza conversațiile existente:", error);
  }
}

export async function createConversationForMatch(
  matchId: string,
  memberIds: [string, string],
  managerIds: [string, string],
): Promise<void> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, matchId);
  if ((await getDoc(conversationRef))?.exists()) return;
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: matchId, matchId, memberIds, managerIds, blockedBy: null,
    createdAt: now, updatedAt: now,
  };
  await setDoc(conversationRef, conversation);
}

export async function getConversationsForManager(managerId: string): Promise<Conversation[]> {
  await ensureConversationsForManager(managerId);
  const snapshot = await getDocs(query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("managerIds", "array-contains", managerId),
  ));
  if (!snapshot?.docs) return [];
  return snapshot.docs
    .map((item) => item.data() as Conversation)
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

export function subscribeToConversations(
  managerId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe {
  void ensureConversationsForManager(managerId);
  const conversationsQuery = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("managerIds", "array-contains", managerId),
  );
  return onSnapshot(conversationsQuery, (snapshot) => {
    const conversations = snapshot?.docs
      ? snapshot.docs.map((item) => item.data() as Conversation)
      : [];
    callback(conversations.sort((a, b) =>
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
    ));
  }, (error) => console.info("Eroare la ascultarea conversațiilor:", error));
}

export function subscribeToConversation(
  conversationId: string,
  callback: (conversation: Conversation | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, CONVERSATIONS_COLLECTION, conversationId),
    (snapshot) => callback(snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as Conversation)
      : null),
    (error) => onError?.(error),
  );
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot?.docs
      ? snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Message[]
      : [];
    callback(messages);
  }, (error) => {
    if (onError) onError(error);
    else console.info("Eroare la ascultarea mesajelor:", error);
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  value: string,
): Promise<void> {
  const text = value.trim();
  if (!text) throw new Error("INVALID_MESSAGE_TEXT");
  if (text.length > 2_000) throw new Error("MESSAGE_TOO_LONG");
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const messageId = generateMessageId();
  const messageRef = doc(
    db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId,
  );
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    if (!snapshot.exists()) throw new Error("CONVERSATION_NOT_FOUND");
    const conversation = snapshot.data() as Conversation;
    if (conversation.blockedBy) throw new Error("CONVERSATION_BLOCKED");
    if (Array.isArray(conversation.managerIds) && !conversation.managerIds.includes(senderId)) {
      throw new Error("UNAUTHORIZED");
    }
    const now = new Date().toISOString();
    const message: Message = {
      id: messageId, conversationId, senderId, senderRole: "manager", text, createdAt: now,
    };
    transaction.set(messageRef, message);
    transaction.update(conversationRef, {
      lastMessage: text, lastMessageAt: now, lastMessageSenderId: senderId, updatedAt: now,
    });
  });
}

export async function blockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const id = blockDocumentId(blockerId, blockedId);
  await runTransaction(db, async (transaction) => {
    const now = new Date().toISOString();
    const block: UserBlock = { id, blockerId, blockedId, createdAt: now };
    transaction.set(doc(db, BLOCKS_COLLECTION, id), block);
    transaction.update(conversationRef, { blockedBy: blockerId, updatedAt: now });
  });
}

export async function unblockUser(
  conversationId: string,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const id = blockDocumentId(blockerId, blockedId);
  await runTransaction(db, async (transaction) => {
    transaction.delete(doc(db, BLOCKS_COLLECTION, id));
    transaction.update(conversationRef, { blockedBy: null, updatedAt: new Date().toISOString() });
  });
}

export async function isConversationBlocked(conversationId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
  if (!snapshot?.exists()) return false;
  return Boolean((snapshot.data() as Conversation).blockedBy);
}
