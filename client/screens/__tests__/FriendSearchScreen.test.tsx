import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import FriendSearchScreen from "@/app/friends/search";
import { sendFriendRequest } from "@/services/social/friendRequestSendService";
import { findUserByUsername } from "@/services/social/userSearchService";
import type { UserSearchResult } from "@/types/social";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "current-user" } }),
}));

jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: () => ({
    profile: { username: "andrei" },
  }),
}));

jest.mock("@/services/social/friendRequestSendService", () => ({
  sendFriendRequest: jest.fn(),
}));

jest.mock("@/services/social/userSearchService", () => ({
  findUserByUsername: jest.fn(),
}));

const mockedFindUserByUsername = jest.mocked(findUserByUsername);
const mockedSendFriendRequest = jest.mocked(sendFriendRequest);

const searchResult: UserSearchResult = {
  uid: "friend-uid",
  username: "anca_21",
  isPrivate: true,
  profile: null,
  relationshipState: "none",
};

describe("Ecranul de căutare a prietenilor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  test("revine la ecranul anterior când există istoric", async () => {
    await render(<FriendSearchScreen />);

    fireEvent.press(screen.getByText("Înapoi"));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("revine la Friends când pagina a fost deschisă direct", async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<FriendSearchScreen />);

    fireEvent.press(screen.getByText("Înapoi"));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/friends");
  });

  test("caută username-ul introdus și afișează rezultatul", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(searchResult);
    await render(<FriendSearchScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("De exemplu: anca_21"), " Anca_21 ");
    await fireEvent.press(screen.getByText("Caută"));

    await waitFor(() => {
      expect(mockedFindUserByUsername).toHaveBeenCalledWith(" Anca_21 ", "current-user");
      expect(screen.getByText("@anca_21")).toBeTruthy();
      expect(screen.getByText("Profil privat")).toBeTruthy();
    });
  });

  test("afișează mesaj când username-ul nu există", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(null);
    await render(<FriendSearchScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("De exemplu: anca_21"), "nimeni");
    await fireEvent.press(screen.getByText("Caută"));

    expect(await screen.findByText("Nu am găsit niciun utilizator cu acest username.")).toBeTruthy();
  });

  test("trimite cererea către rezultatul găsit", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(searchResult);
    mockedSendFriendRequest.mockResolvedValueOnce({} as never);
    await render(<FriendSearchScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("De exemplu: anca_21"), "anca_21");
    await fireEvent.press(screen.getByText("Caută"));
    await fireEvent.press(await screen.findByText("Trimite cerere"));

    await waitFor(() => {
      expect(mockedSendFriendRequest).toHaveBeenCalledWith({
        senderId: "current-user",
        senderUsername: "andrei",
        receiverId: "friend-uid",
        receiverUsername: "anca_21",
      });
      expect(screen.getByText("Cererea de prietenie a fost trimisă.")).toBeTruthy();
      expect(screen.getByText("Cerere trimisă")).toBeTruthy();
    });
  });
});
