import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from "@/types/profile";
import type { PublicProfile } from "@/types/social";
import {
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import {
  calculateAgeFromBirthDate,
  normalizeUsername,
} from "@/utils/profileData";

import { db } from "./firebase";

const USERS_COLLECTION = "users";
const USERNAMES_COLLECTION = "usernames";
const PUBLIC_PROFILES_COLLECTION = "publicProfiles";

export { normalizeUsername } from "@/utils/profileData";

function isUserProfile(value: unknown, expectedUid: string): value is UserProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  const stringFields = [
    "username",
    "email",
    "birthDate",
    "firstName",
    "lastName",
    "occupation",
    "description",
    "gdprAcceptedAt",
    "createdAt",
    "updatedAt",
  ];

  return (
    profile.uid === expectedUid &&
    stringFields.every((field) => typeof profile[field] === "string") &&
    ["female", "male", "other"].includes(profile.gender as string) &&
    Array.isArray(profile.interests) &&
    profile.interests.every((interest) => typeof interest === "string") &&
    typeof profile.isPrivate === "boolean" &&
    typeof profile.profileCompleted === "boolean" &&
    (profile.photoUrl === undefined || typeof profile.photoUrl === "string")
  );
}

function requireUserProfile(value: unknown, expectedUid: string): UserProfile {
  if (!isUserProfile(value, expectedUid)) {
    throw new Error("PROFILE_INVALID");
  }

  return value;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalized);
  const snapshot = await getDoc(usernameRef);

  return !snapshot.exists();
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
    age: calculateAgeFromBirthDate(profile.birthDate),
    isPrivate: profile.isPrivate,
    updatedAt: new Date().toISOString(),
  };

  if (profile.photoUrl) {
    publicProfile.photoUrl = profile.photoUrl;
  }

  return publicProfile;
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
  const publicProfileRef = doc(
    db,
    PUBLIC_PROFILES_COLLECTION,
    input.uid,
  );

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
    transaction.set(publicProfileRef, toPublicProfile(profile));
  });

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return requireUserProfile(snapshot.data(), uid);
}

export async function updateUserProfile(
  uid: string,
  updates: UpdateUserProfileInput,
): Promise<void> {
  const profileRef = doc(db, USERS_COLLECTION, uid);
  const publicProfileRef = doc(db, PUBLIC_PROFILES_COLLECTION, uid);

  await runTransaction(db, async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef);

    if (!profileSnapshot.exists()) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    const savedProfile = requireUserProfile(profileSnapshot.data(), uid);
    const updatedAt = new Date().toISOString();
    const updatedProfile: UserProfile = {
      ...savedProfile,
      ...updates,
      updatedAt,
    };

    transaction.update(profileRef, { ...updates, updatedAt });
    transaction.set(publicProfileRef, toPublicProfile(updatedProfile));
  });
}
