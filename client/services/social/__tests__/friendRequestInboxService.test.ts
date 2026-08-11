import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import type { FriendRequest } from "../../../types/social";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
} from "../friendRequestInboxService";

jest.mock("../../firebase", () => ({
  db: { name: "test-db" },
}));

jest.mock("../socialIds", () => ({
  createPairId: (uidA: string, uidB: string) =>
    [uidA, uidB].sort().join("_"),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  where: jest.fn(),
}));

const mockedCollection = jest.mocked(collection);
const mockedDoc = jest.mocked(doc);
const mockedGetDocs = jest.mocked(getDocs);
const mockedOrderBy = jest.mocked(orderBy);
const mockedQuery = jest.mocked(query);
const mockedRunTransaction = jest.mocked(runTransaction);
const mockedWhere = jest.mocked(where);

const pendingRequest: FriendRequest = {
  id: "alice_bob",
  senderId: "alice",
  senderUsername: "alice_user",
  receiverId: "bob",
  receiverUsername: "bob_user",
  memberIds: ["alice", "bob"],
  status: "pending",
  createdAt: "2026-08-05T10:00:00.000Z",
  updatedAt: "2026-08-05T10:00:00.000Z",
};

function createRequestSnapshot(
  request: FriendRequest = pendingRequest,
  exists = true,
) {
  return {
    id: request.id,
    exists: () => exists,
    data: () => {
      const { id: _id, ...data } = request;
      return data;
    },
  };
}

function prepareTransaction(request: FriendRequest = pendingRequest) {
  const transaction = {
    delete: jest.fn(),
    get: jest.fn(async () => createRequestSnapshot(request)),
    set: jest.fn(),
  };

  mockedRunTransaction.mockImplementation(async (_database, updateFunction) =>
    updateFunction(transaction as never),
  );

  return transaction;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-05T12:00:00.000Z"));

  mockedCollection.mockImplementation(
    (_database: unknown, collectionName: string) => collectionName as never,
  );
  mockedDoc.mockImplementation(
    (
      _database: unknown,
      collectionName: string | undefined,
      documentId: string | undefined,
    ) => `${collectionName}/${documentId}` as never,
  );
  mockedWhere.mockImplementation(
    (field, operator, value) => ({ field, operator, value }) as never,
  );
  mockedOrderBy.mockImplementation(
    (field, direction) => ({ field, direction }) as never,
  );
  mockedQuery.mockImplementation(
    (baseQuery, ...constraints) => ({ baseQuery, constraints }) as never,
  );
});

describe("friend request lists", () => {
  it("returns incoming pending requests ordered from newest to oldest", async () => {
    mockedGetDocs.mockResolvedValue({
      docs: [createRequestSnapshot()],
    } as never);

    const result = await getIncomingFriendRequests("bob");

    expect(result).toEqual([pendingRequest]);
    expect(mockedCollection).toHaveBeenCalledWith(
      expect.anything(),
      "friendRequests",
    );
    expect(mockedWhere).toHaveBeenCalledWith("receiverId", "==", "bob");
    expect(mockedWhere).toHaveBeenCalledWith("status", "==", "pending");
    expect(mockedOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it("returns outgoing pending requests ordered from newest to oldest", async () => {
    mockedGetDocs.mockResolvedValue({
      docs: [createRequestSnapshot()],
    } as never);

    const result = await getOutgoingFriendRequests("alice");

    expect(result).toEqual([pendingRequest]);
    expect(mockedWhere).toHaveBeenCalledWith("senderId", "==", "alice");
    expect(mockedWhere).toHaveBeenCalledWith("status", "==", "pending");
    expect(mockedOrderBy).toHaveBeenCalledWith("createdAt", "desc");
  });
});

describe("acceptFriendRequest", () => {
  it("creates the friendship and deletes the request in one transaction", async () => {
    const transaction = prepareTransaction();

    await acceptFriendRequest("alice_bob", "bob");

    expect(mockedRunTransaction).toHaveBeenCalledTimes(1);
    expect(transaction.get).toHaveBeenCalledWith(
      "friendRequests/alice_bob",
    );
    expect(transaction.set).toHaveBeenCalledWith(
      "friendships/alice_bob",
      {
        id: "alice_bob",
        memberIds: ["alice", "bob"],
        memberUsernames: ["alice_user", "bob_user"],
        createdAt: "2026-08-05T12:00:00.000Z",
      },
    );
    expect(transaction.delete).toHaveBeenCalledWith(
      "friendRequests/alice_bob",
    );
  });

  it("does not let a user other than the receiver accept", async () => {
    const transaction = prepareTransaction();

    await expect(
      acceptFriendRequest("alice_bob", "mallory"),
    ).rejects.toThrow("ONLY_RECEIVER_CAN_RESPOND");
    expect(transaction.set).not.toHaveBeenCalled();
    expect(transaction.delete).not.toHaveBeenCalled();
  });
});

describe("declineFriendRequest", () => {
  it("lets the receiver delete a pending request", async () => {
    const transaction = prepareTransaction();

    await declineFriendRequest("alice_bob", "bob");

    expect(transaction.delete).toHaveBeenCalledWith(
      "friendRequests/alice_bob",
    );
  });

  it("does not let another user decline the request", async () => {
    const transaction = prepareTransaction();

    await expect(
      declineFriendRequest("alice_bob", "alice"),
    ).rejects.toThrow("ONLY_RECEIVER_CAN_RESPOND");
    expect(transaction.delete).not.toHaveBeenCalled();
  });
});

describe("cancelFriendRequest", () => {
  it("lets the sender delete a pending request", async () => {
    const transaction = prepareTransaction();

    await cancelFriendRequest("alice_bob", "alice");

    expect(transaction.delete).toHaveBeenCalledWith(
      "friendRequests/alice_bob",
    );
  });

  it("does not let another user cancel the request", async () => {
    const transaction = prepareTransaction();

    await expect(
      cancelFriendRequest("alice_bob", "bob"),
    ).rejects.toThrow("ONLY_SENDER_CAN_CANCEL");
    expect(transaction.delete).not.toHaveBeenCalled();
  });
});

describe("invalid transitions", () => {
  it("rejects an action when the request no longer exists", async () => {
    const transaction = {
      delete: jest.fn(),
      get: jest.fn(async () => createRequestSnapshot(pendingRequest, false)),
      set: jest.fn(),
    };
    mockedRunTransaction.mockImplementation(
      async (_database, updateFunction) =>
        updateFunction(transaction as never),
    );

    await expect(
      cancelFriendRequest("alice_bob", "alice"),
    ).rejects.toThrow("FRIEND_REQUEST_NOT_FOUND");
    expect(transaction.delete).not.toHaveBeenCalled();
  });

  it("rejects a request that is no longer pending", async () => {
    const invalidRequest = {
      ...pendingRequest,
      status: "accepted",
    } as unknown as FriendRequest;
    const transaction = prepareTransaction(invalidRequest);

    await expect(
      acceptFriendRequest("alice_bob", "bob"),
    ).rejects.toThrow("FRIEND_REQUEST_NOT_PENDING");
    expect(transaction.set).not.toHaveBeenCalled();
    expect(transaction.delete).not.toHaveBeenCalled();
  });
});
