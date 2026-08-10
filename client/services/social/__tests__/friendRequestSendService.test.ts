import { doc, runTransaction } from "firebase/firestore";

import { sendFriendRequest } from "../friendRequestSendService";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("@/services/firebase", () => ({
  db: { name: "test-db" },
}));

const mockedDoc = jest.mocked(doc);
const mockedRunTransaction = jest.mocked(runTransaction);

const input = {
  senderId: "andrei-uid",
  senderUsername: " Andrei ",
  receiverId: "anca-uid",
  receiverUsername: " Anca_21 ",
};

function snapshot(exists: boolean) {
  return { exists: () => exists } as never;
}

function prepareTransaction(friendshipExists = false, requestExists = false) {
  const transaction = {
    get: jest
      .fn()
      .mockResolvedValueOnce(snapshot(friendshipExists))
      .mockResolvedValueOnce(snapshot(requestExists)),
    set: jest.fn(),
  };

  mockedRunTransaction.mockImplementation(async (_db, callback) =>
    callback(transaction as never),
  );

  return transaction;
}

describe("Trimiterea unei cereri de prietenie", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedDoc.mockImplementation((...args: unknown[]) =>
      args.slice(1).join("/") as never,
    );
  });

  test("nu permite trimiterea unei cereri către propriul cont", async () => {
    await expect(
      sendFriendRequest({ ...input, receiverId: input.senderId }),
    ).rejects.toThrow("CANNOT_SEND_REQUEST_TO_SELF");

    expect(mockedRunTransaction).not.toHaveBeenCalled();
  });

  test("creează o cerere pending cu un identificator comun perechii", async () => {
    const transaction = prepareTransaction();

    const request = await sendFriendRequest(input);

    expect(transaction.get).toHaveBeenNthCalledWith(
      1,
      "friendships/anca-uid_andrei-uid",
    );
    expect(transaction.get).toHaveBeenNthCalledWith(
      2,
      "friendRequests/anca-uid_andrei-uid",
    );
    expect(transaction.set).toHaveBeenCalledWith(
      "friendRequests/anca-uid_andrei-uid",
      request,
    );
    expect(request).toMatchObject({
      id: "anca-uid_andrei-uid",
      senderId: "andrei-uid",
      senderUsername: "andrei",
      receiverId: "anca-uid",
      receiverUsername: "anca_21",
      memberIds: ["andrei-uid", "anca-uid"],
      status: "pending",
    });
    expect(request.createdAt).toBe(request.updatedAt);
  });

  test("oprește cererea dacă utilizatorii sunt deja prieteni", async () => {
    const transaction = prepareTransaction(true, false);

    await expect(sendFriendRequest(input)).rejects.toThrow("ALREADY_FRIENDS");
    expect(transaction.set).not.toHaveBeenCalled();
  });

  test("oprește o cerere duplicată indiferent cine a trimis-o inițial", async () => {
    const transaction = prepareTransaction(false, true);

    await expect(sendFriendRequest(input)).rejects.toThrow(
      "FRIEND_REQUEST_ALREADY_EXISTS",
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });

  test("transmite mai departe erorile Firestore", async () => {
    mockedRunTransaction.mockRejectedValueOnce(new Error("permission-denied"));

    await expect(sendFriendRequest(input)).rejects.toThrow("permission-denied");
  });
});
