import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  isProfileLoading: boolean;
  profileError: string;
  refreshProfile: (uid?: string) => Promise<void>;
  updateProfile: (changes: UpdateUserProfileInput) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [loadedProfileUid, setLoadedProfileUid] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const isProfileLoading =
    isLoadingRequest || Boolean(user && loadedProfileUid !== user.uid);

  const refreshProfile = useCallback(async (uid?: string) => {
    const profileUid = uid ?? user?.uid;

    if (!profileUid) {
      setProfile(null);
      setLoadedProfileUid(null);
      setProfileError("");
      setIsLoadingRequest(false);
      return;
    }

    setIsLoadingRequest(true);
    setProfileError("");

    try {
      const savedProfile = await getUserProfile(profileUid);
      setProfile(savedProfile);
      setLoadedProfileUid(profileUid);
    } catch (error) {
      console.error("Profilul nu a putut fi încărcat:", error);
      setProfile(null);
      setLoadedProfileUid(profileUid);
      setProfileError("Profilul nu a putut fi încărcat.");
    } finally {
      setIsLoadingRequest(false);
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
