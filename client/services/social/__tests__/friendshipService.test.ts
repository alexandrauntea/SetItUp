import { getFriends } from "../friendshipService";
import { where } from "firebase/firestore";

jest.mock("@/services/firebase", () => ({
  db: {},
}));

const mockGetDocs = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "mock-friendships"),
  doc: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: jest.fn(() => "mock-query"),
  where: jest.fn(() => "mock-where"),
  writeBatch: jest.fn(),
}));

const mockWhere = where as jest.MockedFunction<typeof where>;

describe("friendshipService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFriends", () => {
    it("queries only friendships containing the authenticated user", async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "alice_bob",
            data: () => ({
              memberIds: ["alice", "bob"],
              memberUsernames: ["alice_user", "bob_user"],
              createdAt: "2026-08-12T10:00:00.000Z",
            }),
          },
        ],
      });

      const friendships = await getFriends("alice");

      expect(mockWhere).toHaveBeenCalledWith(
        "memberIds",
        "array-contains",
        "alice"
      );
      expect(friendships).toEqual([
        {
          id: "alice_bob",
          memberIds: ["alice", "bob"],
          memberUsernames: ["alice_user", "bob_user"],
          createdAt: "2026-08-12T10:00:00.000Z",
        },
      ]);
    });

    it("propagates Firestore errors to the screen", async () => {
      mockGetDocs.mockRejectedValueOnce(new Error("permission-denied"));

      await expect(getFriends("alice")).rejects.toThrow("permission-denied");
    });
  });
});
