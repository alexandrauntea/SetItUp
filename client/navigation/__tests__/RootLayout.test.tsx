import { render, waitFor } from "@testing-library/react-native";

import RootLayout from "@/app/_layout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import type { UserProfile } from "@/types/profile";
import { useRouter, useSegments } from "expo-router";

jest.mock("@/services/firebase", () => ({}));

jest.mock("@/services/authService", () => ({
  logoutUser: jest.fn(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/ProfileContext", () => ({
  ProfileProvider: ({ children }: { children: React.ReactNode }) => children,
  useProfile: jest.fn(),
}));

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Stack = ({ children }: { children: React.ReactNode }) => (
    <View>{children}</View>
  );
  Stack.Screen = () => null;

  return {
    Stack,
    useRouter: jest.fn(),
    useSegments: jest.fn(),
  };
});

jest.mock("expo-status-bar", () => ({
  StatusBar: require("react-native").View,
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseRouter = jest.mocked(useRouter);
const mockedUseSegments = jest.mocked(useSegments);
const replace = jest.fn();
const refreshProfile = jest.fn();

const completedProfile = {
  profileCompleted: true,
} as UserProfile;

function setState({
  user = null,
  profile = null,
  profileStatus = "idle",
  segments = [],
}: {
  user?: { uid: string } | null;
  profile?: UserProfile | null;
  profileStatus?: "idle" | "loading" | "ready" | "missing" | "error";
  segments?: string[];
}) {
  mockedUseAuth.mockReturnValue({
    user: user as never,
    isLoading: false,
    isAuthenticated: Boolean(user),
  });
  mockedUseProfile.mockReturnValue({
    profile,
    profileStatus,
    isProfileLoading: false,
    profileError: "",
    refreshProfile,
    updateProfile: jest.fn(),
  });
  mockedUseSegments.mockReturnValue(segments as never);
}

describe("Navigarea protejată", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace } as never);
  });

  test("trimite vizitatorul neautentificat la login", async () => {
    setState({ segments: ["profile", "view"] });
    await render(<RootLayout />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  test("nu redirecționează vizitatorul aflat deja în zona de autentificare", async () => {
    setState({ segments: ["(auth)", "login"] });
    await render(<RootLayout />);

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });

  test("trimite utilizatorul fără document de profil la recuperare", async () => {
    setState({
      user: { uid: "user-123" },
      profileStatus: "missing",
      segments: ["profile", "view"],
    });
    await render(<RootLayout />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/profile/recover");
    });
  });

  test("trimite profilul incomplet la pașii de configurare", async () => {
    setState({
      user: { uid: "user-123" },
      profile: { ...completedProfile, profileCompleted: false },
      profileStatus: "ready",
      segments: ["profile", "view"],
    });
    await render(<RootLayout />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/profile/create");
    });
  });

  test("trimite profilul complet de la login la pagina de profil", async () => {
    setState({
      user: { uid: "user-123" },
      profile: completedProfile,
      profileStatus: "ready",
      segments: ["(auth)", "login"],
    });
    await render(<RootLayout />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/profile/view");
    });
  });
});
