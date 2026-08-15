import { db } from "@/services/firebase";
import type {
  FeedPage,
  FeedPreferences,
  FeedProfile,
  FeedRequest,
  Match,
  Reaction,
} from "@/types/feed";
import type { Friendship, ManagerRelationship, PublicProfile } from "@/types/social";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export type GetFeed = (request: FeedRequest) => Promise<FeedPage>;

export const FEED_DEFAULT_PAGE_SIZE = 20;
export const FEED_PREFERRED_PROFILE_RATIO = 0.8;
export const FEED_RANDOM_PROFILE_RATIO = 0.2;

const PUBLIC_PROFILES_COLLECTION = "publicProfiles";
const FRIENDSHIPS_COLLECTION = "friendships";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";
const REACTIONS_COLLECTION = "reactions";
const MATCHES_COLLECTION = "matches";

interface FeedCursor {
  seed: string;
  offset: number;
}

function parseCursor(cursor?: string): FeedCursor {
  if (!cursor) {
    return {
      seed: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
      offset: 0,
    };
  }

  const separatorIndex = cursor.lastIndexOf(":");
  const seed = cursor.slice(0, separatorIndex);
  const offset = Number(cursor.slice(separatorIndex + 1));

  if (
    separatorIndex <= 0
    || !/^[a-z0-9]+$/i.test(seed)
    || !Number.isSafeInteger(offset)
    || offset < 0
  ) {
    throw new Error("INVALID_FEED_CURSOR");
  }

  return { seed, offset };
}

function seededScore(seed: string, uid: string): number {
  let hash = 2166136261;

  for (const character of `${seed}:${uid}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededOrder<T extends { uid: string }>(items: T[], seed: string): T[] {
  return [...items].sort((itemA, itemB) => {
    const scoreDifference = seededScore(seed, itemA.uid) - seededScore(seed, itemB.uid);
    return scoreDifference || itemA.uid.localeCompare(itemB.uid);
  });
}

export function matchesFeedPreferences(
  profile: PublicProfile,
  preferences: FeedPreferences,
): boolean {
  const normalizedInterests = new Set(
    profile.interests.map((interest) => interest.trim().toLocaleLowerCase()),
  );
  const matchesInterest = preferences.interests.length === 0
    || preferences.interests.some((interest) =>
      normalizedInterests.has(interest.trim().toLocaleLowerCase()),
    );

  return profile.age >= preferences.minAge
    && profile.age <= preferences.maxAge
    && (preferences.genders.length === 0
      || preferences.genders.includes(profile.gender))
    && matchesInterest;
}

function mixProfiles(
  preferredProfiles: FeedProfile[],
  randomProfiles: FeedProfile[],
  pageSize: number,
): FeedProfile[] {
  const result: FeedProfile[] = [];
  let preferredIndex = 0;
  let randomIndex = 0;

  while (
    preferredIndex < preferredProfiles.length
    || randomIndex < randomProfiles.length
  ) {
    const remainingSlots = Math.min(
      pageSize,
      preferredProfiles.length - preferredIndex + randomProfiles.length - randomIndex,
    );
    const preferredTarget = Math.round(remainingSlots * FEED_PREFERRED_PROFILE_RATIO);
    const randomTarget = remainingSlots - preferredTarget;
    const preferredCount = Math.min(
      preferredTarget,
      preferredProfiles.length - preferredIndex,
    );
    const randomCount = Math.min(
      randomTarget,
      randomProfiles.length - randomIndex,
    );

    result.push(
      ...preferredProfiles.slice(preferredIndex, preferredIndex + preferredCount),
      ...randomProfiles.slice(randomIndex, randomIndex + randomCount),
    );
    preferredIndex += preferredCount;
    randomIndex += randomCount;

    const missingCount = remainingSlots - preferredCount - randomCount;
    if (missingCount > 0) {
      const preferredFallbackCount = Math.min(
        missingCount,
        preferredProfiles.length - preferredIndex,
      );
      result.push(
        ...preferredProfiles.slice(
          preferredIndex,
          preferredIndex + preferredFallbackCount,
        ),
      );
      preferredIndex += preferredFallbackCount;

      const randomFallbackCount = missingCount - preferredFallbackCount;
      result.push(
        ...randomProfiles.slice(randomIndex, randomIndex + randomFallbackCount),
      );
      randomIndex += randomFallbackCount;
    }
  }

  return result;
}

function otherMember(friendship: Friendship, uid: string): string | null {
  return friendship.memberIds.find((memberId) => memberId !== uid) ?? null;
}

async function getMutualFriendsCount(
  candidateId: string,
  ownerFriendIds: Set<string>,
): Promise<number> {
  if (ownerFriendIds.size === 0) {
    return 0;
  }

  const snapshot = await getDocs(query(
    collection(db, FRIENDSHIPS_COLLECTION),
    where("memberIds", "array-contains", candidateId),
  ));

  return snapshot.docs.reduce((count, friendshipDocument) => {
    const friendship = friendshipDocument.data() as Friendship;
    const friendId = otherMember(friendship, candidateId);
    return count + (friendId && ownerFriendIds.has(friendId) ? 1 : 0);
  }, 0);
}

export const getFeed: GetFeed = async (request) => {
  const pageSize = request.limit ?? FEED_DEFAULT_PAGE_SIZE;
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new Error("INVALID_FEED_LIMIT");
  }

  if (request.preferences.ownerId !== request.ownerId) {
    throw new Error("INVALID_FEED_PREFERENCES_OWNER");
  }

  const relationshipSnapshot = await getDoc(doc(
    db,
    MANAGER_RELATIONSHIPS_COLLECTION,
    request.ownerId,
  ));
  if (!relationshipSnapshot.exists()) {
    throw new Error("OWNER_HAS_NO_MANAGER");
  }

  const ownerRelationship = relationshipSnapshot.data() as ManagerRelationship;
  if (ownerRelationship.managerId !== request.actorId) {
    throw new Error("FEED_MANAGER_ONLY");
  }

  const [profilesSnapshot, friendshipsSnapshot, reactionsSnapshot, matchesSnapshot] =
    await Promise.all([
      getDocs(collection(db, PUBLIC_PROFILES_COLLECTION)),
      getDocs(query(
        collection(db, FRIENDSHIPS_COLLECTION),
        where("memberIds", "array-contains", request.ownerId),
      )),
      getDocs(query(
        collection(db, REACTIONS_COLLECTION),
        where("ownerId", "==", request.ownerId),
      )),
      getDocs(query(
        collection(db, MATCHES_COLLECTION),
        where("memberIds", "array-contains", request.ownerId),
      )),
    ]);

  const ownerFriendIds = new Set(
    friendshipsSnapshot.docs
      .map((friendshipDocument) =>
        otherMember(friendshipDocument.data() as Friendship, request.ownerId),
      )
      .filter((uid): uid is string => Boolean(uid)),
  );
  const now = Date.now();
  const hiddenByReaction = new Set(
    reactionsSnapshot.docs
      .map((reactionDocument) => reactionDocument.data() as Reaction)
      .filter((reaction) => reaction.value === "like"
        || !reaction.expiresAt
        || Date.parse(reaction.expiresAt) > now)
      .map((reaction) => reaction.targetId),
  );
  const matchedProfileIds = new Set(
    matchesSnapshot.docs
      .map((matchDocument) => matchDocument.data() as Match)
      .flatMap((match) => match.memberIds)
      .filter((uid) => uid !== request.ownerId),
  );
  const excludedIds = new Set([
    request.ownerId,
    request.actorId,
    ...ownerFriendIds,
    ...hiddenByReaction,
    ...matchedProfileIds,
  ]);
  const publicProfiles = profilesSnapshot.docs
    .map((profileDocument) => profileDocument.data() as PublicProfile)
    .filter((profile) => !profile.isPrivate && !excludedIds.has(profile.uid));

  const eligibleProfiles = (await Promise.all(publicProfiles.map(async (profile) => {
    const candidateRelationshipSnapshot = await getDoc(doc(
      db,
      MANAGER_RELATIONSHIPS_COLLECTION,
      profile.uid,
    ));
    if (!candidateRelationshipSnapshot.exists()) {
      return null;
    }

    const candidateRelationship = candidateRelationshipSnapshot.data() as ManagerRelationship;
    if (candidateRelationship.managerId === request.actorId) {
      return null;
    }

    return {
      ...profile,
      matchesPreferences: matchesFeedPreferences(profile, request.preferences),
      mutualFriendsCount: await getMutualFriendsCount(profile.uid, ownerFriendIds),
    } satisfies FeedProfile;
  }))).filter((profile): profile is FeedProfile => profile !== null);

  const cursor = parseCursor(request.cursor);
  const preferredProfiles = seededOrder(
    eligibleProfiles.filter((profile) => profile.matchesPreferences),
    `${cursor.seed}p`,
  );
  const randomProfiles = seededOrder(
    eligibleProfiles.filter((profile) => !profile.matchesPreferences),
    `${cursor.seed}r`,
  );
  const orderedProfiles = mixProfiles(preferredProfiles, randomProfiles, pageSize);
  const profiles = orderedProfiles.slice(cursor.offset, cursor.offset + pageSize);
  const nextOffset = cursor.offset + profiles.length;

  return {
    profiles,
    nextCursor: nextOffset < orderedProfiles.length
      ? `${cursor.seed}:${nextOffset}`
      : null,
  };
};
