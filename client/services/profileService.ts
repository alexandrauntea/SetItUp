import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from "@/types/profile";
import type { PublicProfile } from "@/types/social";
import { doc, getDoc, runTransaction, setDoc, updateDoc } from "firebase/firestore";

import { db } from "./firebase";

const USERS_COLLECTION = "users";
const USERNAMES_COLLECTION = "usernames";
const PUBLIC_PROFILES_COLLECTION = "publicProfiles";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  const snapshot = await getDoc(usernameRef);

  return !snapshot.exists();
}

function calculateAge(birthDate: string): number {
  const [day, month, year] = birthDate.split("/").map(Number);

  if (!day || !month || !year) return 0;

  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;

  return Math.max(age, 0);
}

function toPublicProfile(profile: UserProfile): PublicProfile {
  const publicProfile: PublicProfile = {
    uid: profile.uid,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    occupation: profile.occupation,
    gender: profile.gender,
    description: profile.description,
    interests: profile.interests,
    age: calculateAge(profile.birthDate),
    isPrivate: profile.isPrivate,
    updatedAt: new Date().toISOString(),
  };

  if (profile.photoUrl) {
    publicProfile.photoUrl = profile.photoUrl;
  }

  return publicProfile;
}

export async function syncProfileToSocial(
  profile: UserProfile,
): Promise<void> {
  await setDoc(
    doc(db, PUBLIC_PROFILES_COLLECTION, profile.uid),
    toPublicProfile(profile),
  );
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
  updates: UpdateUserProfileInput,
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
