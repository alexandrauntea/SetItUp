import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import FriendsScreen from "@/app/friends";
import { getFriends, removeFriend } from "@/services/social/friendshipService";
import { requestConfirmation } from "@/utils/platformAlert";

const mockPush = jest.fn();
const mockUser = { uid: "current-user" };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").Text,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("@/services/social/friendshipService", () => ({
  getFriends: jest.fn(),
  removeFriend: jest.fn(),
}));

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
  showPlatformAlert: jest.fn(),
}));

const mockedGetFriends = jest.mocked(getFriends);
const mockedRemoveFriend = jest.mocked(removeFriend);
const mockedRequestConfirmation = jest.mocked(requestConfirmation);

const friendship = {
  id: "current-user_friend-user",
  memberIds: ["current-user", "friend-user"] as [string, string],
  memberUsernames: ["andrei", "anca_21"] as [string, string],
  createdAt: "2026-08-12T10:00:00.000Z",
};

describe("Ecranul listei de prieteni", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFriends.mockResolvedValue([friendship]);
  });

  test("afișează prietenii încărcați și deschide profilul selectat", async () => {
    await render(<FriendsScreen />);

    expect(await screen.findByText("@anca_21")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();

    await fireEvent.press(screen.getByText("Vezi profilul"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/users/[uid]",
      params: { uid: "friend-user" },
    });
  });

  test("elimină prietenul numai după confirmare", async () => {
    mockedRequestConfirmation.mockResolvedValue(true);
    mockedRemoveFriend.mockResolvedValue();
    await render(<FriendsScreen />);

    await fireEvent.press(await screen.findByText("Remove friend"));

    await waitFor(() => {
      expect(mockedRemoveFriend).toHaveBeenCalledWith(
        "current-user",
        "friend-user",
      );
      expect(screen.queryByText("@anca_21")).toBeNull();
    });
  });

  test("afișează eroarea de încărcare și permite reîncercarea", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedGetFriends
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce([]);
    await render(<FriendsScreen />);

    await fireEvent.press(await screen.findByText("Încearcă din nou"));

    await waitFor(() => expect(mockedGetFriends).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Lista este goală")).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
