import {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from "@/types/profile";
import {
  doc,
  getDoc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const USERS_COLLECTION = "users";
const USERNAMES_COLLECTION = "usernames";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  const snapshot = await getDoc(usernameRef);

  return !snapshot.exists();
}

export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<UserProfile> {
  const normalizedUsername = normalizeUsername(input.username);
  const now = new Date().toISOString();

  const profile: UserProfile = {
    ...input,
    username: normalizedUsername,
    createdAt: now,
    updatedAt: now,
  };

  const profileRef = doc(db, USERS_COLLECTION, input.uid);
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalizedUsername);

  await runTransaction(db, async (transaction) => {
    const usernameSnapshot = await transaction.get(usernameRef);

    if (usernameSnapshot.exists()) {
      throw new Error("USERNAME_TAKEN");
    }

    transaction.set(usernameRef, {
      uid: input.uid,
      createdAt: now,
    });
    transaction.set(profileRef, profile);
  });

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
  updates: UpdateUserProfileInput,
): Promise<void> {
  const profileRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
