import { createContext, ReactNode, useContext, useState } from "react";

export type ProfileData = {
  username: string;
  email: string;
  birthDate: string;
  firstName: string;
  lastName: string;
  description: string;
  occupation: string;
  gender: string;
  interests: string[];
  isPrivate: boolean;
};

const initialProfile: ProfileData = {
  username: "andrei",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  description: "Student, pasionat de tehnologie, concerte și city break-uri.",
  occupation: "Student",
  gender: "Masculin",
  interests: ["Tehnologie", "Muzică", "Călătorii"],
  isPrivate: false,
};

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (changes: Partial<ProfileData>) => void;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState(initialProfile);

  function updateProfile(changes: Partial<ProfileData>) {
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
