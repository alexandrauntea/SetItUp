import { fireEvent, render, screen } from "@testing-library/react-native";

import FriendSearchScreen from "@/app/friends/search";

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
  searchUserByUsername: jest.fn(),
}));

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

  test("revine la profil când pagina a fost deschisă direct", async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<FriendSearchScreen />);

    fireEvent.press(screen.getByText("Înapoi"));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/profile/view");
  });
});
