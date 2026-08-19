export type Gender = "female" | "male" | "other";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  birthDate: string;
  firstName: string;
  lastName: string;
  occupation: string;
  gender: Gender;
  description: string;
  interests: string[];
  isPrivate: boolean;
  photoUrl?: string;
  photoPaths?: string[];
  primaryPhotoPath?: string;
  gdprAcceptedAt: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserProfileInput = Omit<
  UserProfile,
  "createdAt" | "updatedAt"
>;

export type UpdateUserProfileInput = Partial<
  Omit<UserProfile, "uid" | "email" | "username" | "createdAt">
>;
