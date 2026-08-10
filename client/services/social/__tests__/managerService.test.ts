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

// @ts-ignore
const g = globalThis as any;

g.jest.mock("@/services/firebase", () => ({
  db: {},
}));

g.jest.mock("@/services/social/friendshipService", () => ({
  areFriends: g.jest.fn(),
}));

const mockAreFriends = areFriends as any;

const mockGetDoc = g.jest.fn();
const mockGetDocs = g.jest.fn();
const mockSetDoc = g.jest.fn();
const mockDeleteDoc = g.jest.fn();
const mockRunTransaction = g.jest.fn();

g.jest.mock("firebase/firestore", () => ({
  collection: g.jest.fn(() => "mock-collection"),
  doc: g.jest.fn((db: any, col: string, id: string) => `doc-${col}-${id}`),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  query: g.jest.fn(() => "mock-query"),
  where: g.jest.fn(),
}));

g.describe("managerService", () => {
  g.beforeEach(() => {
    g.jest.clearAllMocks();
  });

  g.describe("sendManagerRequest", () => {
    g.it("should throw CANNOT_MANAGE_SELF when ownerId equals managerId", async () => {
      await g.expect(sendManagerRequest("userA", "userA")).rejects.toThrow(
        "CANNOT_MANAGE_SELF"
      );
    });

    g.it("should throw NOT_FRIENDS when users are not friends", async () => {
      mockAreFriends.mockResolvedValueOnce(false);
      await g.expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "NOT_FRIENDS"
      );
    });

    g.it("should throw ALREADY_HAS_MANAGER if owner already has a manager", async () => {
      mockAreFriends.mockResolvedValueOnce(true);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ownerId: "ownerA", managerId: "otherManager" }),
      });

      await g.expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "ALREADY_HAS_MANAGER"
      );
    });

    g.it("should throw REQUEST_ALREADY_EXISTS if request doc already exists", async () => {
      mockAreFriends.mockResolvedValueOnce(true);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
      });

      await g.expect(sendManagerRequest("ownerA", "managerB")).rejects.toThrow(
        "REQUEST_ALREADY_EXISTS"
      );
    });

    g.it("should create manager request when valid", async () => {
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

      g.expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const setCallArg = mockSetDoc.mock.calls[0][1];
      g.expect(setCallArg).toMatchObject({
        id: "ownerA_managerB",
        ownerId: "ownerA",
        ownerUsername: "owner_user",
        managerId: "managerB",
        managerUsername: "manager_user",
        status: "pending",
      });
    });
  });

  g.describe("getIncomingManagerRequests", () => {
    g.it("should fetch incoming requests for manager", async () => {
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
      g.expect(res).toHaveLength(1);
      g.expect(res[0].ownerId).toBe("owner1");
    });
  });

  g.describe("getOutgoingManagerRequests", () => {
    g.it("should fetch outgoing requests for owner", async () => {
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
      g.expect(res).toHaveLength(1);
      g.expect(res[0].managerId).toBe("mgr1");
    });
  });

  g.describe("acceptManagerRequest", () => {
    g.it("should throw REQUEST_NOT_FOUND if request doc does not exist", async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      await g.expect(acceptManagerRequest("req123", "user1")).rejects.toThrow(
        "REQUEST_NOT_FOUND"
      );
    });

    g.it("should throw UNAUTHORIZED if currentUid is not managerId", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await g.expect(
        acceptManagerRequest("owner1_mgr1", "wrongUser")
      ).rejects.toThrow("UNAUTHORIZED");
    });

    g.it("should run transaction to accept request when authorized", async () => {
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
          get: g.jest.fn().mockResolvedValue({ exists: () => false }),
          set: g.jest.fn(),
          delete: g.jest.fn(),
        };
        await cb(transactionMock);
        g.expect(transactionMock.set).toHaveBeenCalled();
        g.expect(transactionMock.delete).toHaveBeenCalled();
      });

      await acceptManagerRequest("owner1_mgr1", "mgr1");
      g.expect(mockRunTransaction).toHaveBeenCalled();
    });
  });

  g.describe("declineManagerRequest", () => {
    g.it("should throw UNAUTHORIZED if user is neither owner nor manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await g.expect(
        declineManagerRequest("owner1_mgr1", "stranger")
      ).rejects.toThrow("UNAUTHORIZED");
    });

    g.it("should delete request when authorized", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await declineManagerRequest("owner1_mgr1", "mgr1");
      g.expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  g.describe("getManagerRelationship and isManagerForUser", () => {
    g.it("should return relationship when exists", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      const rel = await getManagerRelationship("owner1");
      g.expect(rel).not.toBeNull();
      g.expect(rel?.managerId).toBe("mgr1");
    });

    g.it("should check isManagerForUser correctly", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      const isMgr = await isManagerForUser("mgr1", "owner1");
      g.expect(isMgr).toBe(true);
    });
  });

  g.describe("removeManager", () => {
    g.it("should throw UNAUTHORIZED if non-participant tries to remove manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await g.expect(removeManager("owner1", "thirdParty")).rejects.toThrow(
        "UNAUTHORIZED"
      );
    });

    g.it("should delete relationship when owner removes manager", async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ownerId: "owner1",
          managerId: "mgr1",
        }),
      });

      await removeManager("owner1", "owner1");
      g.expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });
});
