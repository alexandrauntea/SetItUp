import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
} from "@/services/profileService";
import type { UpdateUserProfileInput, UserProfile } from "@/types/profile";

type ProfileContextValue = {
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  isProfileLoading: boolean;
  profileError: string;
  refreshProfile: (uid?: string) => Promise<void>;
  updateProfile: (changes: UpdateUserProfileInput) => Promise<void>;
};

export type ProfileStatus =
  | "idle"
  | "loading"
  | "ready"
  | "missing"
  | "error";

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [loadedProfileUid, setLoadedProfileUid] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const profileRequestId = useRef(0);
  const isProfileLoading =
    profileStatus === "loading" ||
    Boolean(user && loadedProfileUid !== user.uid);

  const refreshProfile = useCallback(async (uid?: string) => {
    const requestId = ++profileRequestId.current;
    const profileUid = uid ?? user?.uid;

    if (!profileUid) {
      setProfile(null);
      setLoadedProfileUid(null);
      setProfileError("");
      setProfileStatus("idle");
      return;
    }

    setProfile(null);
    setProfileStatus("loading");
    setProfileError("");

    try {
      const savedProfile = await getUserProfile(profileUid);

      if (requestId !== profileRequestId.current) {
        return;
      }

      setProfile(savedProfile);
      setLoadedProfileUid(profileUid);
      setProfileStatus(savedProfile ? "ready" : "missing");
    } catch (error) {
      if (requestId !== profileRequestId.current) {
        return;
      }

      console.error("Profilul nu a putut fi încărcat:", error);
      setProfile(null);
      setLoadedProfileUid(profileUid);
      setProfileError("Profilul nu a putut fi încărcat.");
      setProfileStatus("error");
    }
  }, [user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  async function updateProfile(changes: UpdateUserProfileInput) {
    if (!user) {
      throw new Error("AUTH_REQUIRED");
    }

    await updateUserProfile(user.uid, changes);
    await refreshProfile();
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        profileStatus,
        isProfileLoading,
        profileError,
        refreshProfile,
        updateProfile,
      }}
    >
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
