export type FriendRequestStatus = "pending";
export type RelationshipState = "none" | "request-sent" | "request-received" | "friends";

export interface UsernameDirectoryEntry {
  uid: string;
  createdAt: string;
}

export interface PublicProfile {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  occupation: string;
  gender: "female" | "male" | "other";
  description: string;
  interests: string[];
  age: number;
  isPrivate: boolean;
  photoUrl?: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  memberIds: [string, string];
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  memberIds: [string, string];
  memberUsernames: [string, string];
  createdAt: string;
}

export interface ManagerRequest {
  id: string;
  ownerId: string;
  ownerUsername: string;
  managerId: string;
  managerUsername: string;
  memberIds: [string, string];
  status: "pending";
  createdAt: string;
  updatedAt: string;
}

export interface ManagerRelationship {
  ownerId: string;
  ownerUsername: string;
  managerId: string;
  managerUsername: string;
  memberIds: [string, string];
  createdAt: string;
}

export type ManagerRole =
  | {
      uid: string;
      role: "owner";
      counterpartId: string;
      createdAt: string;
    }
  | {
      uid: string;
      role: "manager";
      counterpartId: string;
      createdAt: string;
    };

export type UserSearchResult = {
  uid: string;
  username: string;
  isPrivate: boolean;
  profile: PublicProfile | null;
  relationshipState: RelationshipState;
};
