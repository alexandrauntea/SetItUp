import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import MatchesScreen from "@/app/matches";
import { listMatches } from "@/services/feed/matchService";
import { getManagedProfiles } from "@/services/social/managerService";
import { getPublicProfileByUid } from "@/services/social/userSearchService";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("expo-image", () => ({
  Image: require("react-native").View,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").Text,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "manager-a" } }),
}));

jest.mock("@/services/feed/matchService", () => ({
  listMatches: jest.fn(),
}));

jest.mock("@/services/social/managerService", () => ({
  getManagedProfiles: jest.fn(),
}));

jest.mock("@/services/social/userSearchService", () => ({
  getPublicProfileByUid: jest.fn(),
}));

const mockedListMatches = jest.mocked(listMatches);
const mockedGetManagedProfiles = jest.mocked(getManagedProfiles);
const mockedGetPublicProfile = jest.mocked(getPublicProfileByUid);

const relationship = {
  ownerId: "owner-a",
  ownerUsername: "owner_alex",
  managerId: "manager-a",
  managerUsername: "manager_stefan",
  memberIds: ["owner-a", "manager-a"] as [string, string],
  createdAt: "2026-08-01T10:00:00.000Z",
};

const match = {
  id: "owner-a_owner-b",
  memberIds: ["owner-a", "owner-b"] as [string, string],
  createdAt: "2026-08-19T10:00:00.000Z",
};

const profile = {
  uid: "owner-b",
  username: "anca_match",
  firstName: "Anca",
  lastName: "Pop",
  occupation: "Designer",
  gender: "female" as const,
  description: "Profil public",
  interests: ["Travel"],
  age: 25,
  isPrivate: false,
  updatedAt: "2026-08-19T09:00:00.000Z",
};

describe("Ecranul Match-uri", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetManagedProfiles.mockResolvedValue([relationship]);
    mockedListMatches.mockResolvedValue([match]);
    mockedGetPublicProfile.mockResolvedValue(profile);
  });

  test("afișează match-urile ownerului și deschide profilul public", async () => {
    await render(<MatchesScreen />);

    expect(await screen.findByText("Anca Pop")).toBeTruthy();
    expect(screen.getByText("@anca_match")).toBeTruthy();
    expect(screen.getByText("Pentru @owner_alex")).toBeTruthy();

    const profileButton = screen.getByRole("button", { name: "Vezi profilul" });
    await fireEvent.press(profileButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/users/[uid]",
      params: { uid: "owner-b" },
    });
  });

  test("afișează starea goală când ownerul nu are match-uri", async () => {
    mockedListMatches.mockResolvedValue([]);
    await render(<MatchesScreen />);

    expect(await screen.findByText("Niciun match încă")).toBeTruthy();
  });

  test("nu expune lista unui utilizator care nu este manager", async () => {
    mockedGetManagedProfiles.mockResolvedValue([]);
    await render(<MatchesScreen />);

    expect(
      await screen.findByText("Disponibil numai managerului"),
    ).toBeTruthy();
    expect(mockedListMatches).not.toHaveBeenCalled();
  });

  test("afișează eroarea și reîncearcă încărcarea", async () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    mockedListMatches
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce([]);
    await render(<MatchesScreen />);

    fireEvent.press(
      await screen.findByRole("button", {
        name: "Încearcă din nou",
      }),
    );

    await waitFor(() => expect(mockedListMatches).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Niciun match încă")).toBeTruthy();
    consoleInfoSpy.mockRestore();
  });

  test("păstrează match-ul vizibil când profilul public nu mai este disponibil", async () => {
    mockedGetPublicProfile.mockResolvedValue(null);
    await render(<MatchesScreen />);

    expect(await screen.findByText("Profil indisponibil")).toBeTruthy();
    expect(
      screen.getByText("Profilul public nu mai poate fi afișat."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Vezi profilul" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });
});
