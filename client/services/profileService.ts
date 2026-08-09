import {
    CreateUserProfileInput,
    UpdateUserProfileInput,
    UserProfile,
} from '@/types/profile';
import { UsernameDirectoryEntry, PublicProfile } from '@/types/social';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    setDoc,
    updateDoc,
    where,
    deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const USERS_COLLECTION = 'users';

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('username', '==', normalized), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  const normalizedUsername = normalizeUsername(input.username);

  const available = await isUsernameAvailable(normalizedUsername);
  if (!available) {
    throw new Error('USERNAME_TAKEN');
  }

  const now = new Date().toISOString();

  const profile: UserProfile = {
    ...input,
    username: normalizedUsername,
    createdAt: now,
    updatedAt: now,
  };

  const profileRef = doc(db, USERS_COLLECTION, input.uid);
  await setDoc(profileRef, profile);
  await syncProfileToSocial(profile);

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: UpdateUserProfileInput
): Promise<void> {
  const profileRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const updatedProfile = await getUserProfile(uid);
  if (updatedProfile) {
    await syncProfileToSocial(updatedProfile);
  }
}

export async function syncProfileToSocial(profile: UserProfile): Promise<void> {
  const uid = profile.uid;

  const usernameEntry: UsernameDirectoryEntry = {
    uid,
    username: profile.username,
    isPrivate: profile.isPrivate,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "usernames", profile.username.toLowerCase()), usernameEntry);

  let age = 0;
  if (profile.birthDate) {
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  const publicGender: 'male' | 'female' | 'other' =
    profile.gender === 'male' || profile.gender === 'female'
      ? profile.gender
      : 'other';

  const publicProfile: PublicProfile = {
    uid,
    username: profile.username,
    firstName: ((profile as { firstName?: string }).firstName) || '',
    lastName: ((profile as { lastName?: string }).lastName) || '',
    occupation: profile.occupation || '',
    gender: publicGender,
    description: profile.description || '',
    interests: profile.interests || [],
    age,
    isPrivate: profile.isPrivate,
    photoUrl: profile.photoUrl,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "publicProfiles", uid), publicProfile);
}