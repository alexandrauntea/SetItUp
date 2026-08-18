import { Gender, PublicProfile } from "./social";

export interface FeedFilterPreferences {
  minAge?: number;
  maxAge?: number;
  gender?: Gender | "any";
  interests?: string[];
}

export interface FeedCandidateProfile {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  occupation: string;
  gender: Gender;
  description: string;
  interests: string[];
  age: number;
  photoUrl?: string;
  isPrivate?: boolean;
}

export interface FeedItem {
  profile: FeedCandidateProfile;
  commonFriendsCount: number;
  isPreferred: boolean;
}

export interface LikeResult {
  isMatch: boolean;
  matchedProfile?: FeedCandidateProfile;
}

export interface LikeRecord {
  id: string;
  fromOwnerId: string;
  toOwnerId: string;
  createdAt: string;
}

export interface DislikeRecord {
  id: string;
  fromOwnerId: string;
  toOwnerId: string;
  createdAt: string;
}

export interface MatchRecord {
  id: string;
  owner1Id: string;
  owner2Id: string;
  memberIds: [string, string];
  createdAt: string;
}