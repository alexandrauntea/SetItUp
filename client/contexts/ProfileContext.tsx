import { createContext, ReactNode, useContext, useState } from "react";
import type { UserProfile } from "@/types/profile";

const initialProfile: UserProfile = {
  uid: "demo-user",
  username: "andrei",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  description: "Student, pasionat de tehnologie, concerte și city break-uri.",
  occupation: "Student",
  gender: "male",
  interests: ["Tehnologie", "Muzică", "Călătorii"],
  isPrivate: false,
  gdprAcceptedAt: new Date(0).toISOString(),
  profileCompleted: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

type ProfileContextValue = {
  profile: UserProfile;
  updateProfile: (changes: Partial<UserProfile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState(initialProfile);

  function updateProfile(changes: Partial<UserProfile>) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      ...changes,
    }));
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile trebuie folosit în ProfileProvider.");
  }

  return context;
}
