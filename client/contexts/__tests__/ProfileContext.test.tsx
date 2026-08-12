import type { User } from "firebase/auth";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile } from "@/services/profileService";
import type { UserProfile } from "@/types/profile";
import { ProfileProvider, useProfile } from "../ProfileContext";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/profileService", () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedGetUserProfile = jest.mocked(getUserProfile);
const mockedUpdateUserProfile = jest.mocked(updateUserProfile);

const profile: UserProfile = {
  uid: "user-123",
  username: "andrei",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  occupation: "Student",
  gender: "male",
  description: "Salut!",
  interests: ["Tehnologie"],
  isPrivate: false,
  gdprAcceptedAt: "2026-08-01T10:00:00.000Z",
  profileCompleted: true,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

function ProfileStateProbe() {
  const context = useProfile();

  return (
    <>
      <Text>
        {context.profileStatus}|{context.isProfileLoading ? "loading" : "done"}|
        {context.profile?.username ?? "none"}|{context.profileError || "no-error"}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => context.updateProfile({ occupation: "Developer" })}
      >
        <Text>Actualizează</Text>
      </Pressable>
    </>
  );
}

describe("ProfileContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-123" } as User,
      isLoading: false,
      isAuthenticated: true,
    });
  });

  test("încarcă profilul utilizatorului autentificat", async () => {
    mockedGetUserProfile.mockResolvedValue(profile);

    await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("ready|done|andrei|no-error")).toBeTruthy();
    });
    expect(mockedGetUserProfile).toHaveBeenCalledWith("user-123");
  });

  test("marchează profilul ca lipsă atunci când documentul nu există", async () => {
    mockedGetUserProfile.mockResolvedValue(null);

    await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("missing|done|none|no-error")).toBeTruthy();
    });
  });

  test("expune un mesaj când încărcarea profilului eșuează", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockedGetUserProfile.mockRejectedValue(new Error("permission-denied"));

    await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "error|done|none|Profilul nu a putut fi încărcat.",
        ),
      ).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  test("actualizează profilul și îl recitește din Firestore", async () => {
    mockedGetUserProfile
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce({ ...profile, occupation: "Developer" });
    mockedUpdateUserProfile.mockResolvedValue(undefined);

    await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await screen.findByText("ready|done|andrei|no-error");
    await fireEvent.press(
      screen.getByRole("button", { name: "Actualizează" }),
    );

    await waitFor(() => {
      expect(mockedUpdateUserProfile).toHaveBeenCalledWith("user-123", {
        occupation: "Developer",
      });
      expect(mockedGetUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  test("nu citește Firestore când nu există utilizator autentificat", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("idle|done|none|no-error")).toBeTruthy();
    });
    expect(mockedGetUserProfile).not.toHaveBeenCalled();
  });

  test("înlocuiește profilul când utilizatorul autentificat se schimbă", async () => {
    let currentUser = { uid: "user-123" } as User;
    const secondProfile = {
      ...profile,
      uid: "user-456",
      username: "maria",
      email: "maria@email.com",
    };

    mockedUseAuth.mockImplementation(() => ({
      user: currentUser,
      isLoading: false,
      isAuthenticated: true,
    }));
    mockedGetUserProfile
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(secondProfile);

    const view = await render(
      <ProfileProvider>
        <ProfileStateProbe />
      </ProfileProvider>,
    );

    await screen.findByText("ready|done|andrei|no-error");

    currentUser = { uid: "user-456" } as User;
    await act(async () => {
      view.rerender(
        <ProfileProvider>
          <ProfileStateProbe />
        </ProfileProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("ready|done|maria|no-error")).toBeTruthy();
    });
    expect(mockedGetUserProfile).toHaveBeenNthCalledWith(1, "user-123");
    expect(mockedGetUserProfile).toHaveBeenNthCalledWith(2, "user-456");
  });
});
