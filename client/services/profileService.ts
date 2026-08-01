import {
    CreateUserProfileInput,
    UpdateUserProfileInput,
    UserProfile,
} from '@/types/profile';
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
}