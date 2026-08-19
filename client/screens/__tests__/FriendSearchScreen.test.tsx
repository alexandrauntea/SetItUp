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

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").Text,
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

async function searchFor(username = "anca_21") {
  await fireEvent.changeText(
    screen.getByPlaceholderText("Caută după numele de utilizator"),
    username,
  );
  await fireEvent.press(screen.getByText("Caută"));
}

describe("Ecranul de căutare a prietenilor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  test("afișează o interfață de căutare fără instrucțiuni redundante", async () => {
    await render(<FriendSearchScreen />);

    expect(screen.getByText("Caută prieteni")).toBeTruthy();
    expect(screen.getByPlaceholderText("Caută după numele de utilizator")).toBeTruthy();
    expect(screen.queryByText("Descoperă persoane")).toBeNull();
  });

  test("revine la ecranul anterior când există istoric", async () => {
    await render(<FriendSearchScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Înapoi" }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("revine la Friends când pagina a fost deschisă direct", async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<FriendSearchScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Înapoi" }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/friends");
  });

  test("caută username-ul introdus și afișează rezultatul", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(searchResult);
    await render(<FriendSearchScreen />);

    await searchFor(" Anca_21 ");

    await waitFor(() => {
      expect(mockedFindUserByUsername).toHaveBeenCalledWith(" Anca_21 ", "current-user");
      expect(screen.getByText("@anca_21")).toBeTruthy();
      expect(screen.getByText("Profil privat")).toBeTruthy();
    });
  });

  test("afișează mesaj când username-ul nu există", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(null);
    await render(<FriendSearchScreen />);

    await searchFor("nimeni");

    expect(
      await screen.findByText(
        "Nu am găsit niciun utilizator cu acest nume de utilizator.",
      ),
    ).toBeTruthy();
  });

  test("afișează mesajul dedicat când utilizatorul se caută pe sine", async () => {
    mockedFindUserByUsername.mockRejectedValueOnce(
      new Error("CANNOT_SEARCH_SELF"),
    );
    await render(<FriendSearchScreen />);

    await searchFor("andrei");

    expect(await screen.findByText("Acesta este contul tău.")).toBeTruthy();
    expect(screen.queryByText("Trimite cerere")).toBeNull();
  });

  test("afișează eroare și elimină rezultatul anterior când o căutare eșuează", async () => {
    mockedFindUserByUsername
      .mockResolvedValueOnce(searchResult)
      .mockRejectedValueOnce(new Error("network-error"));
    await render(<FriendSearchScreen />);

    await searchFor();
    expect(await screen.findByText("@anca_21")).toBeTruthy();

    await searchFor("alt_user");

    expect(
      await screen.findByText("Căutarea nu a reușit. Încearcă din nou."),
    ).toBeTruthy();
    expect(screen.queryByText("@anca_21")).toBeNull();
  });

  test("trimite cererea către rezultatul găsit", async () => {
    mockedFindUserByUsername.mockResolvedValueOnce(searchResult);
    mockedSendFriendRequest.mockResolvedValueOnce({} as never);
    await render(<FriendSearchScreen />);

    await searchFor();
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

  test.each([
    [
      "FRIEND_REQUEST_ALREADY_EXISTS",
      "Există deja o cerere între voi.",
    ],
    ["ALREADY_FRIENDS", "Sunteți deja prieteni."],
    ["permission-denied", "Cererea nu a putut fi trimisă. Încearcă din nou."],
  ])(
    "afișează mesajul potrivit când trimiterea eșuează cu %s",
    async (errorCode, expectedMessage) => {
      mockedFindUserByUsername.mockResolvedValueOnce(searchResult);
      mockedSendFriendRequest.mockRejectedValueOnce(new Error(errorCode));
      await render(<FriendSearchScreen />);

      await searchFor();
      await fireEvent.press(await screen.findByText("Trimite cerere"));

      expect(await screen.findByText(expectedMessage)).toBeTruthy();
      expect(screen.getByText("Trimite cerere")).toBeTruthy();
      expect(screen.queryByText("Cerere trimisă")).toBeNull();
    },
  );
});
