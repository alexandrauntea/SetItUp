export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  birthDate: string;
  name?: string;
  description?: string;
  interests: string[];
  occupation?: string;
  gender?: Gender;
  isPrivate: boolean;
  photoUrl?: string;
  gdprAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserProfileInput = Omit<UserProfile, 'createdAt' | 'updatedAt'>;

export type UpdateUserProfileInput = Partial<Omit<UserProfile, 'uid' | 'email' | 'username' | 'createdAt'>>;