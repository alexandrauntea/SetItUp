import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ChatScreen from "@/app/messages/[conversationId]";
import {
  blockUser,
  sendMessage,
  subscribeToConversation,
  subscribeToMessages,
  unblockUser,
} from "@/services/messagingService";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import { requestConfirmation } from "@/utils/platformAlert";
import type { Conversation, Message } from "@/types/messaging";

const mockBack = jest.fn();
const mockPush = jest.fn();
let conversationCallback: (conversation: Conversation | null) => void;
let messagesCallback: (messages: Message[]) => void;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ conversationId: "owner-a_owner-b" }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "manager-a" } }),
}));

jest.mock("@/services/messagingService", () => ({
  subscribeToConversation: jest.fn(),
  subscribeToMessages: jest.fn(),
  sendMessage: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
}));

jest.mock("@/services/social/userSearchService", () => ({
  getPublicProfileByUid: jest.fn(),
}));

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
  showPlatformAlert: jest.fn(),
}));

jest.mock("expo-image", () => ({
  Image: require("react-native").View,
}));

const conversation: Conversation = {
  id: "owner-a_owner-b",
  matchId: "owner-a_owner-b",
  memberIds: ["owner-a", "owner-b"],
  managerIds: ["manager-a", "manager-b"],
  blockedBy: null,
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-20T10:00:00.000Z",
};

const profile = {
  uid: "owner-b",
  username: "anca_match",
  firstName: "Anca",
  lastName: "Pop",
  occupation: "Designer",
  gender: "female" as const,
  description: "Profil public",
  interests: ["Călătorii"],
  age: 25,
  photoUrl: "https://example.com/photo.jpg",
  isPrivate: false,
  updatedAt: "2026-08-20T10:00:00.000Z",
};

describe("Ecranul conversației", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(subscribeToConversation).mockImplementation((_id, callback) => {
      conversationCallback = callback;
      callback(conversation);
      return jest.fn();
    });
    jest.mocked(subscribeToMessages).mockImplementation((_id, callback) => {
      messagesCallback = callback;
      callback([
        {
          id: "message-1",
          conversationId: conversation.id,
          senderId: "manager-b",
          senderRole: "manager",
          text: "Bună!",
          createdAt: "2026-08-20T10:01:00.000Z",
        },
      ]);
      return jest.fn();
    });
    jest.mocked(getPublicProfileByUid).mockResolvedValue(profile);
    jest.mocked(requestConfirmation).mockResolvedValue(true);
    jest.mocked(sendMessage).mockResolvedValue();
    jest.mocked(blockUser).mockResolvedValue();
    jest.mocked(unblockUser).mockResolvedValue();
  });

  test("afișează mesajele realtime și trimite un mesaj nou", async () => {
    await render(<ChatScreen />);

    expect(await screen.findByText("Bună!")).toBeTruthy();
    expect(await screen.findByText("Anca Pop")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Mesaj"), "  Salut!  ");
    await fireEvent.press(screen.getByRole("button", { name: "Trimite mesajul" }));

    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        "owner-a_owner-b",
        "manager-a",
        "  Salut!  ",
      ),
    );
    expect(screen.getByLabelText("Mesaj").props.value).toBe("");
  });

  test("deschide profilul ownerului din antet", async () => {
    await render(<ChatScreen />);
    await screen.findByText("Anca Pop");

    await fireEvent.press(screen.getByRole("button", { name: "Vezi profilul" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/users/[uid]",
      params: {
        uid: "owner-b",
        backToChat: "true",
        conversationId: "owner-a_owner-b",
      },
    });
  });

  test("blochează conversația și dezactivează trimiterea când actualizarea realtime sosește", async () => {
    await render(<ChatScreen />);
    await screen.findByText("Anca Pop");

    await fireEvent.press(screen.getByRole("button", { name: "Acțiuni conversație" }));
    await fireEvent.press(screen.getByRole("button", { name: "Blochează" }));

    await waitFor(() =>
      expect(blockUser).toHaveBeenCalledWith(
        "owner-a_owner-b",
        "manager-a",
        "manager-b",
      ),
    );

    await act(async () => conversationCallback({ ...conversation, blockedBy: "manager-a" }));
    expect(screen.getByText("Utilizatorul este blocat. Nu îi poți trimite mesaje.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trimite mesajul" }).props.accessibilityState.disabled).toBe(true);
  });

  test("deblochează conversația blocată de managerul curent", async () => {
    jest.mocked(subscribeToConversation).mockImplementation((_id, callback) => {
      conversationCallback = callback;
      callback({ ...conversation, blockedBy: "manager-a" });
      return jest.fn();
    });
    await render(<ChatScreen />);
    await screen.findByText("Anca Pop");

    await fireEvent.press(screen.getByRole("button", { name: "Acțiuni conversație" }));
    await fireEvent.press(screen.getByRole("button", { name: "Deblochează" }));

    await waitFor(() =>
      expect(unblockUser).toHaveBeenCalledWith(
        "owner-a_owner-b",
        "manager-a",
        "manager-b",
      ),
    );
  });

  test("actualizează lista când subscripția primește mesaje noi", async () => {
    await render(<ChatScreen />);
    await screen.findByText("Bună!");

    await act(async () =>
      messagesCallback([
        {
          id: "message-2",
          conversationId: conversation.id,
          senderId: "manager-a",
          senderRole: "manager",
          text: "Mesaj realtime",
          createdAt: "2026-08-20T10:02:00.000Z",
        },
      ]),
    );

    expect(screen.getByText("Mesaj realtime")).toBeTruthy();
  });
});
