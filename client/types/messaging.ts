export interface Conversation {
  id: string;
  matchId: string;
  memberIds: [string, string];
  managerIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  blockedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "manager";
  text: string;
  createdAt: string;
}
export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}
