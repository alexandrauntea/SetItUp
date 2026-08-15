import type { PublicProfile } from "@/types/social";

export type FeedGender = PublicProfile["gender"];
export type ReactionValue = "like" | "dislike";
export type ReactionActorRole = "owner" | "manager";

export interface FeedProfile extends PublicProfile {
  matchesPreferences: boolean;
  mutualFriendsCount: number;
}

export interface FeedPreferences {
  ownerId: string;
  minAge: number;
  maxAge: number;
  genders: FeedGender[];
  interests: string[];
  updatedAt: string;
}

export interface FeedRequest {
  ownerId: string;
  actorId: string;
  preferences: FeedPreferences;
  limit?: number;
  cursor?: string;
}

export interface FeedPage {
  profiles: FeedProfile[];
  nextCursor: string | null;
}

export interface Reaction {
  id: string;
  ownerId: string;
  targetId: string;
  actorId: string;
  actorRole: ReactionActorRole;
  value: ReactionValue;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface SaveReactionInput {
  ownerId: string;
  actorId: string;
  targetId: string;
  value: ReactionValue;
}

export interface Match {
  id: string;
  memberIds: [string, string];
  createdAt: string;
}
