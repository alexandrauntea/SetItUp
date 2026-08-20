import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import ConversationsScreen from "@/app/messages";
import { getPublicProfileByUid } from "@/services/social/userSearchService";

const mockPush = jest.fn();
const mockUnsubscribe = jest.fn();
const mockOnSnapshot = jest.fn();
let mockSnapshotHandler: ((snapshot: { docs: unknown[] }) => void) | undefined;
let mockErrorHandler: (() => void) | undefined;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "manager-a" } }),
}));

jest.mock("@/services/firebase", () => ({ db: {} }));

jest.mock("@/services/social/userSearchService", () => ({
  getPublicProfileByUid: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({ kind: "collection" })),
  where: jest.fn(() => ({ kind: "constraint" })),
  query: jest.fn(() => ({ kind: "query" })),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

const mockedGetPublicProfile = jest.mocked(getPublicProfileByUid);

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
  photoUrl: "https://example.com/anca.jpg",
  updatedAt: "2026-08-19T09:00:00.000Z",
};

function conversationDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-owner-a-owner-b",
    data: () => ({
      matchId: "match-owner-a-owner-b",
      memberIds: ["owner-a", "owner-b"],
      managerIds: ["manager-a", "manager-b"],
      lastMessage: "Salut! Ne auzim mâine?",
      lastMessageAt: "2026-08-20T14:32:00",
      lastMessageSenderId: "manager-b",
      blockedBy: null,
      createdAt: "2026-08-20T13:00:00",
      updatedAt: "2026-08-20T14:32:00",
      ...overrides,
    }),
  };
}

describe("Ecranul Conversații", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapshotHandler = undefined;
    mockErrorHandler = undefined;
    mockOnSnapshot.mockImplementation(
      (
        _query: unknown,
        onNext: (snapshot: { docs: unknown[] }) => void,
        onError: () => void,
      ) => {
        mockSnapshotHandler = onNext;
        mockErrorHandler = onError;
        return mockUnsubscribe;
      },
    );
    mockedGetPublicProfile.mockResolvedValue(profile);
  });

  test("afișează conversația, mesajul nou și deschide chatul corect", async () => {
    await render(<ConversationsScreen />);

    await act(async () => {
      mockSnapshotHandler?.({ docs: [conversationDocument()] });
    });

    expect(await screen.findByText("Anca")).toBeTruthy();
    expect(screen.getByText("Salut! Ne auzim mâine?")).toBeTruthy();
    expect(screen.getByText("14:32")).toBeTruthy();
    expect(screen.getByText("Mesaj nou")).toBeTruthy();
    expect(mockedGetPublicProfile).toHaveBeenCalledWith(
      "owner-b",
      "manager-a",
    );

    fireEvent.press(
      screen.getByRole("button", {
        name: "Deschide conversația cu Anca",
      }),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/messages/[conversationId]",
      params: { conversationId: "match-owner-a-owner-b" },
    });
  });

  test("prioritizează badge-ul de conversație blocată", async () => {
    await render(<ConversationsScreen />);

    await act(async () => {
      mockSnapshotHandler?.({
        docs: [conversationDocument({ blockedBy: "manager-a" })],
      });
    });

    expect(await screen.findByText("Blocat")).toBeTruthy();
    expect(screen.queryByText("Mesaj nou")).toBeNull();
  });

  test("afișează starea goală când managerul nu are conversații", async () => {
    await render(<ConversationsScreen />);

    await act(async () => {
      mockSnapshotHandler?.({ docs: [] });
    });

    expect(await screen.findByText("Nicio conversație încă")).toBeTruthy();
  });

  test("afișează o stare sigură când abonarea eșuează", async () => {
    await render(<ConversationsScreen />);

    await act(async () => {
      mockErrorHandler?.();
    });

    expect(
      await screen.findByText("Nu am putut încărca mesajele"),
    ).toBeTruthy();
  });

  test("închide abonarea Firestore la demontare", async () => {
    const view = await render(<ConversationsScreen />);

    await waitFor(() => expect(mockSnapshotHandler).toBeDefined());
    await view.unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
