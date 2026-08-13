import { areFriends } from "@/services/social/friendshipService";
import {
  acceptManagerRequest,
  declineManagerRequest,
  getIncomingManagerRequests,
  getManagerRelationship,
  getOutgoingManagerRequests,
  isManagerForUser,
  removeManager,
  sendManagerRequest,
} from "../managerService";

jest.mock("@/services/firebase", () => ({
  db: {},
}));

jest.mock("@/services/social/friendshipService", () => ({
  areFriends: jest.fn(),
}));

const mockAreFriends = areFriends as any;

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "mock-collection"),
  doc: jest.fn((db: any, col: string, id: string) => `doc-${col}-${id}`),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  query: jest.fn(() => "mock-query"),
  where: jest.fn(),
}));

describe("managerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendManagerRequest", () => {
    it("should throw CANNOT_MANAGE_SELF when ownerId equals managerId", async () => {
      await expect(sendManagerRequest("userA", "userA")).rejects.toThrow(
        "CANNOT_MANAGE_SELF"
      );
    });

    it("should throw NOT_FRIENDS when users are not friends", async () => {
      mockAreFriends.mockResolvedValueOnce(false);
      await expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "NOT_FRIENDS"
      );
    });

    it("should throw ALREADY_HAS_MANAGER if owner already has a manager", async () => {
      mockAreFriends.mockResolvedValueOnce(true);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ownerId: "ownerA", managerId: "otherManager" }),
      });

      await expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "ALREADY_HAS_MANAGER"
      );
    });

    it("should throw REQUEST_ALREADY_EXISTS if request doc already exists", async () => {
      mockAreFriends.mockResolvedValueOnce(true);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
      });

      await expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "REQUEST_ALREADY_EXISTS"
      );
    });

    it("should create manager request when valid", async () => {
      mockAreFriends.mockResolvedValueOnce(true);
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ username: "owner_user" }),
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ username: "manager_user" }),
      });

      await sendManagerRequest("ownerA", "managerB");

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const setCallArg = mockSetDoc.mock.calls[0][1];
      expect(setCallArg).toMatchObject({
        id: "ownerA_managerB",
        ownerId: "ownerA",
        ownerUsername: "owner_user",
        managerId: "managerB",
        managerUsername: "manager_user",
        status: "pending",
      });
    });
  });

  describe("getIncomingManagerRequests", () => {
    it("should fetch incoming requests for manager", async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "owner1_mgr",
            data: () => ({
              ownerId: "owner1",
              managerId: "mgr",
              status: "pending",
            }),
          },
        ],
      });

      const res = await getIncomingManagerRequests("mgr");
      expect(res).toHaveLength(1);
      expect(res[0].ownerId).toBe("owner1");
    });
  });

  describe("getOutgoingManagerRequests", () => {
    it("should fetch outgoing requests for owner", async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "owner_mgr1",
            data: () => ({
              ownerId: "owner",
              managerId: "mgr1",
              status: "pending",
            }),
          },
        ],
      });

      const res = await getOutgoingManagerRequests("owner");
      expect(res).toHaveLength(1);
      expect(res[0].managerId).toBe("mgr1");
    });
  });

  describe("acceptManagerRequest", () => {
    it("should throw REQUEST_NOT_FOUND if request doc does not exist", async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      await expect(acceptManagerRequest("req123", "user1")).rejects.toThrow(
        "REQUEST_NOT_FOUND"
      );
    });

    it("should throw UNAUTHORIZED if currentUid is not managerId", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await expect(
        acceptManagerRequest("owner1_mgr1", "wrongUser")
      ).rejects.toThrow("UNAUTHORIZED");
    });

    it("should run transaction to accept request when authorized", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          ownerUsername: "owner1_name",
          managerId: "mgr1",
          managerUsername: "mgr1_name",
          status: "pending",
        }),
      });

      mockRunTransaction.mockImplementationOnce(async (db: any, cb: any) => {
        const transactionMock = {
          get: jest.fn().mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
          delete: jest.fn(),
        };
        await cb(transactionMock);
        expect(transactionMock.set).toHaveBeenCalled();
        expect(transactionMock.delete).toHaveBeenCalled();
      });

      await acceptManagerRequest("owner1_mgr1", "mgr1");
      expect(mockRunTransaction).toHaveBeenCalled();
    });
  });

  describe("declineManagerRequest", () => {
    it("should throw UNAUTHORIZED if user is neither owner nor manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await expect(
        declineManagerRequest("owner1_mgr1", "stranger")
      ).rejects.toThrow("UNAUTHORIZED");
    });

    it("should delete request when authorized", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await declineManagerRequest("owner1_mgr1", "mgr1");
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("getManagerRelationship and isManagerForUser", () => {
    it("should return relationship when exists", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      const rel = await getManagerRelationship("owner1");
      expect(rel).not.toBeNull();
      expect(rel?.managerId).toBe("mgr1");
    });

    it("should check isManagerForUser correctly", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      const isMgr = await isManagerForUser("mgr1", "owner1");
      expect(isMgr).toBe(true);
    });
  });

  describe("removeManager", () => {
    it("should throw UNAUTHORIZED if non-participant tries to remove manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await expect(removeManager("owner1", "thirdParty")).rejects.toThrow(
        "UNAUTHORIZED"
      );
    });

    it("should delete relationship when owner removes manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await removeManager("owner1", "owner1");
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });
});
