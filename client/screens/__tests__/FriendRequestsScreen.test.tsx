import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import FriendRequestsScreen from "@/app/friends/requests";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
} from "@/services/social/friendRequestInboxService";
import { requestConfirmation } from "@/utils/platformAlert";

const mockUser = { uid: "current-user" };

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").Text,
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("@/services/social/friendRequestInboxService", () => ({
  acceptFriendRequest: jest.fn(),
  cancelFriendRequest: jest.fn(),
  declineFriendRequest: jest.fn(),
  getIncomingFriendRequests: jest.fn(),
  getOutgoingFriendRequests: jest.fn(),
}));

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
}));

const mockedAccept = jest.mocked(acceptFriendRequest);
const mockedCancel = jest.mocked(cancelFriendRequest);
const mockedIncoming = jest.mocked(getIncomingFriendRequests);
const mockedOutgoing = jest.mocked(getOutgoingFriendRequests);
const mockedConfirmation = jest.mocked(requestConfirmation);

const incomingRequest = {
  id: "alice_current-user",
  senderId: "alice",
  senderUsername: "alice_user",
  receiverId: "current-user",
  receiverUsername: "andrei",
  memberIds: ["alice", "current-user"] as [string, string],
  status: "pending" as const,
  createdAt: "2026-08-12T10:00:00.000Z",
  updatedAt: "2026-08-12T10:00:00.000Z",
};

const outgoingRequest = {
  id: "current-user_bob",
  senderId: "current-user",
  senderUsername: "andrei",
  receiverId: "bob",
  receiverUsername: "bob_user",
  memberIds: ["current-user", "bob"] as [string, string],
  status: "pending" as const,
  createdAt: "2026-08-12T11:00:00.000Z",
  updatedAt: "2026-08-12T11:00:00.000Z",
};

describe("Ecranul cererilor de prietenie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIncoming.mockResolvedValue([incomingRequest]);
    mockedOutgoing.mockResolvedValue([outgoingRequest]);
  });

  test("afișează separat cererile primite și trimise", async () => {
    await render(<FriendRequestsScreen />);

    expect(await screen.findByText("@alice_user")).toBeTruthy();
    expect(screen.getByText("@bob_user")).toBeTruthy();
    expect(mockedIncoming).toHaveBeenCalledWith("current-user");
    expect(mockedOutgoing).toHaveBeenCalledWith("current-user");
  });

  test("acceptă cererea și o elimină din inbox", async () => {
    mockedAccept.mockResolvedValue();
    await render(<FriendRequestsScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Acceptă" }),
    );

    await waitFor(() => {
      expect(mockedAccept).toHaveBeenCalledWith(
        incomingRequest.id,
        "current-user",
      );
      expect(screen.queryByText("@alice_user")).toBeNull();
    });
  });

  test("anulează cererea trimisă după confirmare", async () => {
    mockedConfirmation.mockResolvedValue(true);
    mockedCancel.mockResolvedValue();
    await render(<FriendRequestsScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Anulează cererea" }),
    );

    await waitFor(() => {
      expect(mockedCancel).toHaveBeenCalledWith(
        outgoingRequest.id,
        "current-user",
      );
      expect(screen.queryByText("@bob_user")).toBeNull();
    });
  });
});
