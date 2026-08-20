import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import {
  blockUser,
  createConversationForMatch,
  getConversationsForManager,
  isConversationBlocked,
  sendMessage,
  subscribeToConversations,
  subscribeToMessages,
  unblockUser,
} from "../messagingService";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, ...paths) => paths.join("/")),
  doc: jest.fn((_db, ...paths) => paths.join("/")),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((col) => col),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("../firebase", () => ({
  db: { name: "test-db" },
}));

const mockedGetDoc = jest.mocked(getDoc);
const mockedGetDocs = jest.mocked(getDocs);
const mockedSetDoc = jest.mocked(setDoc);
const mockedDeleteDoc = jest.mocked(deleteDoc);
const mockedOnSnapshot = jest.mocked(onSnapshot);
const mockedRunTransaction = jest.mocked(runTransaction);

describe("Serviciul de Mesagerie (messagingService)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createConversationForMatch", () => {
    test("creează un document de conversație nou dacă nu există deja", async () => {
      mockedGetDoc.mockResolvedValueOnce({ exists: () => false } as never);
      mockedSetDoc.mockResolvedValueOnce(undefined as never);

      await createConversationForMatch(
        "match123",
        ["owner1", "owner2"],
        ["mgr1", "mgr2"],
      );

      expect(mockedSetDoc).toHaveBeenCalledWith(
        "conversations/match123",
        expect.objectContaining({
          id: "match123",
          matchId: "match123",
          memberIds: ["owner1", "owner2"],
          managerIds: ["mgr1", "mgr2"],
          blockedBy: null,
        }),
      );
    });

    test("nu creează document nou dacă conversația există deja", async () => {
      mockedGetDoc.mockResolvedValueOnce({ exists: () => true } as never);

      await createConversationForMatch(
        "match123",
        ["owner1", "owner2"],
        ["mgr1", "mgr2"],
      );

      expect(mockedSetDoc).not.toHaveBeenCalled();
    });
  });

  describe("getConversationsForManager", () => {
    test("obține și sortează conversațiile unui manager", async () => {
      const conv1 = {
        id: "c1",
        updatedAt: "2026-08-20T10:00:00.000Z",
      };
      const conv2 = {
        id: "c2",
        updatedAt: "2026-08-20T12:00:00.000Z",
      };

      mockedGetDocs
        .mockResolvedValueOnce({ empty: true, docs: [] } as never)
        .mockResolvedValueOnce({
          docs: [
            { data: () => conv1 },
            { data: () => conv2 },
          ],
        } as never);

      const result = await getConversationsForManager("mgr1");
      expect(result).toEqual([conv2, conv1]);
    });
  });

  describe("subscribeToConversations", () => {
    test("instalează subscripție realtime pentru conversații", () => {
      const unsubscribeMock = jest.fn();
      mockedGetDocs.mockResolvedValue({ empty: true, docs: [] } as never);
      mockedOnSnapshot.mockImplementation((_q, callback: any) => {
        callback({
          docs: [
            { data: () => ({ id: "c1", updatedAt: "2026-08-20T10:00:00.000Z" }) },
          ],
        });
        return unsubscribeMock;
      });

      const cb = jest.fn();
      const unsub = subscribeToConversations("mgr1", cb);

      expect(cb).toHaveBeenCalledWith([
        { id: "c1", updatedAt: "2026-08-20T10:00:00.000Z" },
      ]);
      expect(unsub).toBe(unsubscribeMock);
    });
  });

  describe("subscribeToMessages", () => {
    test("instalează subscripție realtime pentru mesaje", () => {
      const unsubscribeMock = jest.fn();
      mockedOnSnapshot.mockImplementation((_q, callback: any) => {
        callback({
          docs: [
            { data: () => ({ id: "m1", text: "Salut", createdAt: "2026-08-20T10:00:00.000Z" }) },
          ],
        });
        return unsubscribeMock;
      });

      const cb = jest.fn();
      const unsub = subscribeToMessages("c1", cb);

      expect(cb).toHaveBeenCalledWith([
        { id: "m1", text: "Salut", createdAt: "2026-08-20T10:00:00.000Z" },
      ]);
      expect(unsub).toBe(unsubscribeMock);
    });
  });

  describe("sendMessage", () => {
    test("aruncă eroare dacă textul este gol", async () => {
      await expect(sendMessage("c1", "mgr1", "   ")).rejects.toThrow(
        "INVALID_MESSAGE_TEXT",
      );
    });

    test("aruncă eroare dacă conversația este blocată", async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ blockedBy: "mgr2" }),
        }),
        set: jest.fn(),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await expect(sendMessage("c1", "mgr1", "Salut")).rejects.toThrow(
        "CONVERSATION_BLOCKED",
      );
    });

    test("trimite mesajul și actualizează atomic conversația părinte", async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ blockedBy: null }),
        }),
        set: jest.fn(),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await sendMessage("c1", "mgr1", "Salutare!");

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "conversations/c1",
        expect.objectContaining({
          lastMessage: "Salutare!",
          lastMessageSenderId: "mgr1",
        }),
      );
    });
  });

  describe("blockUser și unblockUser", () => {
    test("blockUser salvează documentul în blocks și actualizează conversația", async () => {
      const mockTransaction = {
        set: jest.fn(),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await blockUser("c1", "mgr1", "mgr2");

      expect(mockTransaction.set).toHaveBeenCalledWith(
        "blocks/mgr1_mgr2",
        expect.objectContaining({
          id: "mgr1_mgr2",
          blockerId: "mgr1",
          blockedId: "mgr2",
        }),
      );
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "conversations/c1",
        expect.objectContaining({
          blockedBy: "mgr1",
        }),
      );
    });

    test("unblockUser șterge documentul din blocks și resetează conversația", async () => {
      const mockTransaction = {
        delete: jest.fn(),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await unblockUser("c1", "mgr1", "mgr2");

      expect(mockTransaction.delete).toHaveBeenCalledWith("blocks/mgr1_mgr2");
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "conversations/c1",
        expect.objectContaining({
          blockedBy: null,
        }),
      );
    });
  });

  describe("isConversationBlocked", () => {
    test("returnează true dacă conversația este blocată", async () => {
      mockedGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ blockedBy: "mgr1" }),
      } as never);

      const blocked = await isConversationBlocked("c1");
      expect(blocked).toBe(true);
    });

    test("returnează false dacă conversația nu este blocată", async () => {
      mockedGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ blockedBy: null }),
      } as never);

      const blocked = await isConversationBlocked("c1");
      expect(blocked).toBe(false);
    });
  });
});
