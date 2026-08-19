import { db } from "@/services/firebase";
import { createPairId } from "@/services/social/socialIds";
import type {
  FriendRequest,
  PublicProfile,
  RelationshipState,
  UserSearchResult,
} from "@/types/social";
import { normalizeUsername } from "@/utils/profileData";
import { doc, getDoc } from "firebase/firestore";

const USERNAMES_COLLECTION = "usernames";
const PUBLIC_PROFILES_COLLECTION = "publicProfiles";
const FRIENDSHIPS_COLLECTION = "friendships";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";

export const normalizeSearchUsername = normalizeUsername;

async function getRelationshipState(
  currentUid: string,
  targetUid: string,
): Promise<RelationshipState> {
  const pairId = createPairId(currentUid, targetUid);

  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, pairId);
  const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, pairId);

  const [friendshipSnapshot, requestSnapshot] = await Promise.all([
    getDoc(friendshipRef),
    getDoc(requestRef),
  ]);

  if (friendshipSnapshot.exists()) {
    return "friends";
  }

  if (requestSnapshot.exists()) {
    const request = requestSnapshot.data() as FriendRequest;

    if (request.senderId === currentUid) {
      return "request-sent";
    }

    return "request-received";
  }

  return "none";
}

async function getVisibleProfile(
  targetUid: string,
  requireExistingProfile = false,
): Promise<PublicProfile | null> {
  const profileRef = doc(db, PUBLIC_PROFILES_COLLECTION, targetUid);

  try {
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      if (requireExistingProfile) {
        throw new Error("PUBLIC_PROFILE_NOT_FOUND");
      }

      return null;
    }

    return profileSnapshot.data() as PublicProfile;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (code === "permission-denied" || code === "firestore/permission-denied") {
      return null;
    }

    throw error;
  }
}

export async function getPublicProfileByUid(
  targetUid: string,
  _currentUid?: string,
): Promise<PublicProfile | null> {
  if (!targetUid.trim()) {
    return null;
  }

  return getVisibleProfile(targetUid);
}

export async function findUserByUsername(
  username: string,
  currentUid: string,
): Promise<UserSearchResult | null> {
  const normalizedUsername = normalizeSearchUsername(username);

  if (!normalizedUsername) {
    return null;
  }

  const usernameRef = doc(db, USERNAMES_COLLECTION, normalizedUsername);
  const usernameSnapshot = await getDoc(usernameRef);

  if (!usernameSnapshot.exists()) {
    return null;
  }

  const targetUid = usernameSnapshot.data().uid as string;

  if (targetUid === currentUid) {
    throw new Error("CANNOT_SEARCH_SELF");
  }

  const [profile, relationshipState] = await Promise.all([
    getVisibleProfile(targetUid, true),
    getRelationshipState(currentUid, targetUid),
  ]);

  if (!profile) {
    throw new Error("PUBLIC_PROFILE_NOT_FOUND");
  }

  return {
    uid: targetUid,
    username: normalizedUsername,
    isPrivate: profile.isPrivate,
    profile,
    relationshipState,
  };
}
