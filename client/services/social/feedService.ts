import { db } from "@/services/firebase";
import { getFriends } from "@/services/social/friendshipService";
import { getManagerRelationship } from "@/services/social/managerService";
import { createPairId } from "@/services/social/socialIds";
import {
  DislikeRecord,
  FeedCandidateProfile,
  FeedFilterPreferences,
  FeedItem,
  LikeRecord,
  LikeResult,
  MatchRecord,
} from "@/types/feed";
import { ManagerRelationship, PublicProfile } from "@/types/social";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const LIKES_COLLECTION = "likes";
const DISLIKES_COLLECTION = "dislikes";
const MATCHES_COLLECTION = "matches";
const PUBLIC_PROFILES_COLLECTION = "publicProfiles";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";

export async function getManagedOwnerForManager(
  managerId: string
): Promise<ManagerRelationship | null> {
  const relsRef = collection(db, MANAGER_RELATIONSHIPS_COLLECTION);
  const q = query(relsRef, where("managerId", "==", managerId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  return {
    ...docSnap.data(),
  } as ManagerRelationship;
}

export async function getFeedProfiles(
  managerId: string,
  filters?: FeedFilterPreferences
): Promise<FeedItem[]> {
  const managerRel = await getManagedOwnerForManager(managerId);
  if (!managerRel) {
    throw new Error("NOT_A_MANAGER");
  }

  const ownerId = managerRel.ownerId;

  // 1. Fetch Owner's friends
  const ownerFriendships = await getFriends(ownerId);
  const ownerFriendUids = new Set<string>();
  for (const f of ownerFriendships) {
    for (const id of f.memberIds) {
      if (id !== ownerId) {
        ownerFriendUids.add(id);
      }
    }
  }

  // 2. Fetch Likes by Owner
  const likesRef = collection(db, LIKES_COLLECTION);
  const likesQuery = query(likesRef, where("fromOwnerId", "==", ownerId));
  const likesSnap = await getDocs(likesQuery);
  const likedUids = new Set<string>();
  likesSnap.docs.forEach((d) => {
    const data = d.data() as LikeRecord;
    likedUids.add(data.toOwnerId);
  });

  // 3. Fetch Dislikes by Owner (< 30 days)
  const dislikesRef = collection(db, DISLIKES_COLLECTION);
  const dislikesQuery = query(dislikesRef, where("fromOwnerId", "==", ownerId));
  const dislikesSnap = await getDocs(dislikesQuery);
  const recentDislikedUids = new Set<string>();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  dislikesSnap.docs.forEach((d) => {
    const data = d.data() as DislikeRecord;
    if (data.createdAt >= thirtyDaysAgo) {
      recentDislikedUids.add(data.toOwnerId);
    }
  });

  // 4. Fetch Matches involving Owner
  const matchesRef = collection(db, MATCHES_COLLECTION);
  const matchesQuery = query(matchesRef, where("memberIds", "array-contains", ownerId));
  const matchesSnap = await getDocs(matchesQuery);
  const matchedUids = new Set<string>();
  matchesSnap.docs.forEach((d) => {
    const data = d.data() as MatchRecord;
    for (const id of data.memberIds) {
      if (id !== ownerId) {
        matchedUids.add(id);
      }
    }
  });

  // 5. Excluded UIDs
  const excludedUids = new Set<string>([
    ownerId,
    managerId,
    ...Array.from(ownerFriendUids),
    ...Array.from(likedUids),
    ...Array.from(recentDislikedUids),
    ...Array.from(matchedUids),
  ]);

  // 6. Fetch Public Profiles
  const publicProfilesRef = collection(db, PUBLIC_PROFILES_COLLECTION);
  const publicProfilesSnap = await getDocs(publicProfilesRef);

  const rawCandidates: PublicProfile[] = [];
  publicProfilesSnap.docs.forEach((d) => {
    const data = { ...d.data(), uid: d.id } as PublicProfile;
    if (!data.isPrivate && !excludedUids.has(data.uid)) {
      rawCandidates.push(data);
    }
  });

  // 7. Filter candidates that HAVE AN ACTIVE MANAGER
  const managerRelsRef = collection(db, MANAGER_RELATIONSHIPS_COLLECTION);
  const managerRelsSnap = await getDocs(managerRelsRef);
  const managedOwnerUids = new Set<string>();
  managerRelsSnap.docs.forEach((d) => {
    const data = d.data() as ManagerRelationship;
    managedOwnerUids.add(data.ownerId);
  });

  const validCandidates = rawCandidates.filter((c) => managedOwnerUids.has(c.uid));

  // 8. Compute common friends count & test filter preference match
  const items: FeedItem[] = [];
  for (const candidate of validCandidates) {
    const candidateFriendships = await getFriends(candidate.uid);
    const candidateFriendUids = new Set<string>();
    for (const f of candidateFriendships) {
      for (const id of f.memberIds) {
        if (id !== candidate.uid) {
          candidateFriendUids.add(id);
        }
      }
    }

    let commonCount = 0;
    ownerFriendUids.forEach((fUid) => {
      if (
        fUid !== managerId &&
        fUid !== candidate.uid &&
        candidateFriendUids.has(fUid)
      ) {
        commonCount++;
      }
    });

    const candidateProfile: FeedCandidateProfile = {
      uid: candidate.uid,
      username: candidate.username,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      occupation: candidate.occupation,
      gender: candidate.gender,
      description: candidate.description,
      interests: candidate.interests || [],
      age: candidate.age,
      photoUrl: candidate.photoUrl,
      isPrivate: candidate.isPrivate,
    };

    let matchesFilter = true;
    if (filters) {
      if (filters.minAge !== undefined && candidateProfile.age < filters.minAge) {
        matchesFilter = false;
      }
      if (filters.maxAge !== undefined && candidateProfile.age > filters.maxAge) {
        matchesFilter = false;
      }
      if (
        filters.gender &&
        filters.gender !== "any" &&
        candidateProfile.gender !== filters.gender
      ) {
        matchesFilter = false;
      }
      if (filters.interests && filters.interests.length > 0) {
        const hasCommonInterest = filters.interests.some((i) =>
          candidateProfile.interests.includes(i)
        );
        if (!hasCommonInterest) {
          matchesFilter = false;
        }
      }
    }

    items.push({
      profile: candidateProfile,
      commonFriendsCount: commonCount,
      isPreferred: matchesFilter,
    });
  }

  // 9. Separate 80% matching preferences & 20% random
  const preferred = items.filter((i) => i.isPreferred);
  const nonPreferred = items.filter((i) => !i.isPreferred);

  const result: FeedItem[] = [];
  let pIdx = 0;
  let npIdx = 0;

  // Interleave 4 preferred to 1 non-preferred (~80%/20%)
  while (pIdx < preferred.length || npIdx < nonPreferred.length) {
    for (let k = 0; k < 4 && pIdx < preferred.length; k++) {
      result.push(preferred[pIdx++]);
    }
    if (npIdx < nonPreferred.length) {
      result.push(nonPreferred[npIdx++]);
    }
  }

  return result;
}

export async function likeProfile(
  managerId: string,
  candidateUid: string
): Promise<LikeResult> {
  const managerRel = await getManagedOwnerForManager(managerId);
  if (!managerRel) {
    throw new Error("NOT_A_MANAGER");
  }

  const ownerId = managerRel.ownerId;
  const now = new Date().toISOString();

  // Save like doc
  const likeId = `${ownerId}_${candidateUid}`;
  const likeRef = doc(db, LIKES_COLLECTION, likeId);
  const likeData: LikeRecord = {
    id: likeId,
    fromOwnerId: ownerId,
    toOwnerId: candidateUid,
    createdAt: now,
  };

  await setDoc(likeRef, likeData);

  // Check for reciprocal like
  const reciprocalId = `${candidateUid}_${ownerId}`;
  const reciprocalRef = doc(db, LIKES_COLLECTION, reciprocalId);
  const reciprocalSnap = await getDoc(reciprocalRef);

  if (reciprocalSnap.exists()) {
    // Create match!
    const matchId = createPairId(ownerId, candidateUid);
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    const matchData: MatchRecord = {
      id: matchId,
      owner1Id: ownerId,
      owner2Id: candidateUid,
      memberIds: [ownerId, candidateUid],
      createdAt: now,
    };

    await setDoc(matchRef, matchData);

    // Get candidate profile
    const candidateRef = doc(db, PUBLIC_PROFILES_COLLECTION, candidateUid);
    const candidateSnap = await getDoc(candidateRef);

    let matchedProfile: FeedCandidateProfile | undefined;
    if (candidateSnap.exists()) {
      const data = candidateSnap.data() as PublicProfile;
      matchedProfile = {
        uid: candidateUid,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        occupation: data.occupation,
        gender: data.gender,
        description: data.description,
        interests: data.interests || [],
        age: data.age,
        photoUrl: data.photoUrl,
        isPrivate: data.isPrivate,
      };
    }

    return {
      isMatch: true,
      matchedProfile,
    };
  }

  return {
    isMatch: false,
  };
}

export async function dislikeProfile(
  managerId: string,
  candidateUid: string
): Promise<void> {
  const managerRel = await getManagedOwnerForManager(managerId);
  if (!managerRel) {
    throw new Error("NOT_A_MANAGER");
  }

  const ownerId = managerRel.ownerId;
  const now = new Date().toISOString();

  const dislikeId = `${ownerId}_${candidateUid}`;
  const dislikeRef = doc(db, DISLIKES_COLLECTION, dislikeId);
  const dislikeData: DislikeRecord = {
    id: dislikeId,
    fromOwnerId: ownerId,
    toOwnerId: candidateUid,
    createdAt: now,
  };

  await setDoc(dislikeRef, dislikeData);
}