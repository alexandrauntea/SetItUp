import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ProfileScreen from "@/app/profile/view";
import { useProfile } from "@/contexts/ProfileContext";
import { logoutUser } from "@/services/authService";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").View,
}));

jest.mock("expo-image", () => ({
  Image: require("react-native").Image,
}));

jest.mock("@/services/photoStorageService", () => ({
  getPhotoDownloadUrl: jest.fn(),
}));

jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: jest.fn(),
}));

jest.mock("@/services/authService", () => ({
  logoutUser: jest.fn(),
}));

const mockedUseProfile = jest.mocked(useProfile);
const mockedLogoutUser = jest.mocked(logoutUser);

const profile = {
  uid: "user-123",
  username: "andrei",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  description: "Îmi place să cunosc oameni noi.",
  occupation: "Student",
  gender: "male",
  interests: ["Tehnologie", "Muzică"],
  isPrivate: true,
  profileCompleted: true,
  gdprAcceptedAt: "2026-08-01T10:00:00.000Z",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

describe("Ecranul profilului", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseProfile.mockReturnValue({ profile } as never);
    mockedLogoutUser.mockResolvedValue(undefined);
  });

  test("afișează o stare de încărcare când profilul nu este disponibil", async () => {
    mockedUseProfile.mockReturnValue({ profile: null } as never);

    await render(<ProfileScreen />);

    expect(screen.getByLabelText("Se încarcă profilul")).toBeTruthy();
  });

  test("afișează informațiile salvate ale utilizatorului", async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText("Andrei Barbuceanu")).toBeTruthy();
    expect(screen.getByText("@andrei")).toBeTruthy();
    expect(screen.getByText("Îmi place să cunosc oameni noi.")).toBeTruthy();
    expect(screen.getByText("Student")).toBeTruthy();
    expect(screen.getByText("Masculin")).toBeTruthy();
    expect(screen.getByText("Privat")).toBeTruthy();
    expect(screen.getByText("Tehnologie")).toBeTruthy();
    expect(screen.getByText("Muzică")).toBeTruthy();
  });

  test("deschide ecranul de editare", async () => {
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByText("Editează profilul"));

    expect(mockPush).toHaveBeenCalledWith("/profile/edit");
  });

  test("deconectează utilizatorul", async () => {
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByText("Deconectare"));

    await waitFor(() => {
      expect(mockedLogoutUser).toHaveBeenCalledTimes(1);
    });
  });

  test("gestionează eroarea de deconectare fără să blocheze ecranul", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedLogoutUser.mockRejectedValue(new Error("logout-error"));
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByText("Deconectare"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Deconectarea a eșuat:",
        expect.any(Error),
      );
    });
    expect(screen.getByText("Andrei Barbuceanu")).toBeTruthy();
    consoleSpy.mockRestore();
  });
});
