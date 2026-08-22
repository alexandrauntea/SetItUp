import { getFriends } from "@/services/social/friendshipService";
import {
  dislikeProfile,
  getFeedProfiles,
  getManagedOwnerForManager,
  likeProfile,
} from "../feedService";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

jest.mock("@/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn((ref) => ref),
  where: jest.fn(),
}));

jest.mock("@/services/social/friendshipService", () => ({
  getFriends: jest.fn(),
}));

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetFriends = getFriends as jest.MockedFunction<typeof getFriends>;

describe("feedService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getManagedOwnerForManager", () => {
    it("should return manager relationship if manager manages an owner", async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              ownerId: "owner123",
              ownerUsername: "owner_user",
              managerId: "mgr123",
              managerUsername: "mgr_user",
              memberIds: ["owner123", "mgr123"],
              createdAt: "2026-08-01T00:00:00Z",
            }),
          },
        ],
      } as any);

      const rel = await getManagedOwnerForManager("mgr123");
      expect(rel).not.toBeNull();
      expect(rel?.ownerId).toBe("owner123");
    });

    it("should return null if user is not a manager", async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const rel = await getManagedOwnerForManager("user_no_rel");
      expect(rel).toBeNull();
    });
  });

  describe("getFeedProfiles", () => {
    it("should throw NOT_A_MANAGER if user manages no owner", async () => {
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] } as any);

      await expect(getFeedProfiles("stranger")).rejects.toThrow("NOT_A_MANAGER");
    });

    it("should filter out excluded uids (owner, manager, friends, likes, recent dislikes, matches) and unmanaged candidates", async () => {
      // 1. Manager relationship
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              ownerId: "owner1",
              managerId: "mgr1",
            }),
          },
        ],
      } as any);

      // Owner friends
      mockGetFriends.mockImplementation(async (uid: string) => {
        if (uid === "owner1") {
          return [
            { id: "f1", memberIds: ["owner1", "friend1"] },
          ] as any;
        }
        if (uid === "cand1") {
          return [
            { id: "f2", memberIds: ["cand1", "friend1"] },
          ] as any;
        }
        return [];
      });

      // Likes by owner -> candidate_liked
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ fromOwnerId: "owner1", toOwnerId: "cand_liked" }) },
        ],
      } as any);

      // Dislikes by owner -> cand_disliked (recent)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              fromOwnerId: "owner1",
              toOwnerId: "cand_disliked",
              createdAt: new Date().toISOString(),
            }),
          },
        ],
      } as any);

      // Matches -> cand_matched
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              memberIds: ["owner1", "cand_matched"],
            }),
          },
        ],
      } as any);

      // Public Profiles: owner1, mgr1, friend1, cand_liked, cand_disliked, cand_matched, cand1 (valid managed), cand_unmanaged
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "cand1",
            data: () => ({
              uid: "cand1",
              username: "candidate1",
              firstName: "Alex",
              lastName: "Popa",
              occupation: "Developer",
              gender: "female",
              description: "Hello",
              interests: ["Coding"],
              age: 25,
              isPrivate: false,
            }),
          },
          {
            id: "cand_unmanaged",
            data: () => ({
              uid: "cand_unmanaged",
              username: "unmanaged_user",
              isPrivate: false,
              age: 26,
            }),
          },
        ],
      } as any);

      // Manager relationships (cand1 is managed, cand_unmanaged is not)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ ownerId: "owner1", managerId: "mgr1" }) },
          { data: () => ({ ownerId: "cand1", managerId: "mgr_cand1" }) },
        ],
      } as any);

      const feed = await getFeedProfiles("mgr1");

      expect(feed).toHaveLength(1);
      expect(feed[0].profile.uid).toBe("cand1");
    });
  });

  describe("likeProfile", () => {
    it("should save like doc and return isMatch false when not reciprocal", async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => ({ ownerId: "owner1", managerId: "mgr1" }) }],
      } as any);

      // Reciprocal check
      mockGetDoc.mockResolvedValueOnce({ exists: () => false } as any);

      const result = await likeProfile("mgr1", "cand1");

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(result.isMatch).toBe(false);
    });

    it("should save like, create match doc, and return isMatch true with profile when reciprocal like exists", async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => ({ ownerId: "owner1", managerId: "mgr1" }) }],
      } as any);

      // Reciprocal check -> exists!
      mockGetDoc.mockResolvedValueOnce({ exists: () => true } as any);

      // Candidate profile lookup
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          username: "cand1_user",
          firstName: "Maria",
          lastName: "Ionescu",
          occupation: "Designer",
          gender: "female",
          description: "Design lover",
          interests: ["Art"],
          age: 24,
        }),
      } as any);

      const result = await likeProfile("mgr1", "cand1");

      expect(mockSetDoc).toHaveBeenCalledTimes(2); // like doc + match doc
      expect(result.isMatch).toBe(true);
      expect(result.matchedProfile?.firstName).toBe("Maria");
    });
  });

  describe("dislikeProfile", () => {
    it("should save dislike doc", async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => ({ ownerId: "owner1", managerId: "mgr1" }) }],
      } as any);

      await dislikeProfile("mgr1", "cand1");

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const callArg = mockSetDoc.mock.calls[0][1];
      expect(callArg).toMatchObject({
        fromOwnerId: "owner1",
        toOwnerId: "cand1",
      });
    });
  });
});
