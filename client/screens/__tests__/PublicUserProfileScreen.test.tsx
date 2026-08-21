import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import PublicUserProfileScreen from "@/app/users/[uid]";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { PublicProfile } from "@/types/social";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();
let mockUid: string | undefined = "target-uid";
let mockBackToChat: string | undefined;
let mockConversationId: string | undefined;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    uid: mockUid,
    backToChat: mockBackToChat,
    conversationId: mockConversationId,
  }),
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
  Ionicons: require("react-native").View,
}));

jest.mock("expo-image", () => ({
  Image: require("react-native").Image,
}));

jest.mock("@/services/photoStorageService", () => ({
  getPhotoDownloadUrl: jest.fn(),
}));

jest.mock("@/services/social/userSearchService", () => ({
  getPublicProfileByUid: jest.fn(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "current-user-uid" },
    loading: false,
  }),
}));

const mockedGetPublicProfileByUid = jest.mocked(getPublicProfileByUid);

const publicProfile: PublicProfile = {
  uid: "target-uid",
  username: "anca_21",
  firstName: "Anca",
  lastName: "Popescu",
  occupation: "Studentă",
  gender: "female",
  description: "Îmi plac muzica și călătoriile.",
  interests: ["Muzică", "Călătorii"],
  age: 21,
  isPrivate: false,
  updatedAt: "2026-08-10T10:00:00.000Z",
};

describe("Ecranul profilului public", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUid = "target-uid";
    mockBackToChat = undefined;
    mockConversationId = undefined;
    mockCanGoBack.mockReturnValue(true);
    mockedGetPublicProfileByUid.mockResolvedValue(publicProfile);
  });

  test("încarcă și afișează datele profilului public", async () => {
    await render(<PublicUserProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText("Anca Popescu, 21")).toBeTruthy();
    });

    expect(mockedGetPublicProfileByUid).toHaveBeenCalledWith(
      "target-uid",
      "current-user-uid",
    );
    expect(screen.getByText("@anca_21")).toBeTruthy();
    expect(screen.getByText("Îmi plac muzica și călătoriile.")).toBeTruthy();
    expect(screen.getByText("Studentă")).toBeTruthy();
    expect(screen.getByText("Feminin")).toBeTruthy();
    expect(screen.getByText("Muzică")).toBeTruthy();
    expect(screen.getByText("Călătorii")).toBeTruthy();
  });

  test("afișează profilul privat când este deschis din afara feedului", async () => {
    mockedGetPublicProfileByUid.mockResolvedValue({
      ...publicProfile,
      isPrivate: true,
    });

    await render(<PublicUserProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText("Anca Popescu, 21")).toBeTruthy();
    });
    expect(screen.queryByText("Profil indisponibil")).toBeNull();
  });

  test("afișează un mesaj sigur când profilul nu poate fi citit", async () => {
    mockedGetPublicProfileByUid.mockResolvedValue(null);

    await render(<PublicUserProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText("Profil indisponibil")).toBeTruthy();
    });
    expect(
      screen.getByText(
        "Profilul nu mai există sau nu a putut fi încărcat.",
      ),
    ).toBeTruthy();
  });

  test("revine la ecranul anterior când există istoric", async () => {
    await render(<PublicUserProfileScreen />);
    await waitFor(() => expect(screen.getByText("Profil")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Înapoi" }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("revine la căutare când profilul a fost deschis direct", async () => {
    mockCanGoBack.mockReturnValue(false);

    await render(<PublicUserProfileScreen />);
    await waitFor(() => expect(screen.getByText("Profil")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Înapoi" }));

    expect(mockReplace).toHaveBeenCalledWith("/friends/search");
  });

  test("închide profilul în conversația exactă când backToChat este activ", async () => {
    mockBackToChat = "true";
    mockConversationId = "match-owner-a-owner-b";

    await render(<PublicUserProfileScreen />);
    await waitFor(() => expect(screen.getByText("Profil")).toBeTruthy());

    fireEvent.press(
      screen.getByRole("button", { name: "Închide profilul" }),
    );

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/messages/[conversationId]",
      params: { conversationId: "match-owner-a-owner-b" },
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("nu interoghează serviciul când ruta nu conține uid", async () => {
    mockUid = undefined;

    await render(<PublicUserProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText("Profil indisponibil")).toBeTruthy();
    });
    expect(mockedGetPublicProfileByUid).not.toHaveBeenCalled();
  });

  test("afișează X și revine exact în chat când profilul este deschis din conversație", async () => {
    mockBackToChat = "true";
    mockConversationId = "owner-a_owner-b";

    await render(<PublicUserProfileScreen />);
    await screen.findByText("Anca Popescu, 21");
    fireEvent.press(screen.getByRole("button", { name: "Închide profilul" }));

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/messages/[conversationId]",
      params: { conversationId: "owner-a_owner-b" },
    });
    expect(mockBack).not.toHaveBeenCalled();
  });
});
