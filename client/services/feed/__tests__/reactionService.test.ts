import type { Match, Reaction } from "@/types/feed";
import { DISLIKE_COOLDOWN_DAYS, saveReaction } from "../reactionService";

jest.mock("@/services/firebase", () => ({ db: {} }));

const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(
    (db: unknown, collection: string, id: string) => `${collection}/${id}`,
  ),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
}));

type SnapshotData = unknown;

function snapshot(data?: SnapshotData) {
  return {
    exists: () => data !== undefined,
    data: () => data,
  };
}

const documents = new Map<string, SnapshotData>();

function activeRelationship(ownerId: string, managerId: string) {
  return {
    ownerId,
    ownerUsername: ownerId,
    managerId,
    managerUsername: managerId,
    memberIds: [ownerId, managerId],
    createdAt: "2026-08-01T10:00:00.000Z",
  };
}

function ownerRole(ownerId: string, managerId: string) {
  return {
    uid: ownerId,
    role: "owner",
    counterpartId: managerId,
    createdAt: "2026-08-01T10:00:00.000Z",
  };
}

const input = {
  ownerId: "owner-a",
  actorId: "manager-a",
  targetId: "owner-b",
  value: "like" as const,
};

describe("reactionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-08-19T12:00:00.000Z"));
    documents.clear();
    documents.set(
      "managerRelationships/owner-a",
      activeRelationship("owner-a", "manager-a"),
    );
    documents.set(
      "managerRoles/owner-b",
      ownerRole("owner-b", "manager-b"),
    );
    mockTransactionGet.mockImplementation(async (reference: string) =>
      snapshot(documents.get(reference)),
    );
    mockRunTransaction.mockImplementation(
      async (db: unknown, callback: (transaction: unknown) => unknown) =>
        callback({
          get: mockTransactionGet,
          set: mockTransactionSet,
        }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("salvează un like direcțional fără să expună reacția opusă", async () => {
    const result = await saveReaction(input);

    expect(result).toEqual({
      reaction: expect.objectContaining({
        id: "owner-a_owner-b",
        ownerId: "owner-a",
        targetId: "owner-b",
        actorId: "manager-a",
        actorRole: "manager",
        value: "like",
      }),
      match: null,
    });
    expect(mockTransactionSet).toHaveBeenCalledTimes(1);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      "reactions/owner-a_owner-b",
      result.reaction,
    );
  });

  test("setează expirarea dislike-ului la exact 30 de zile", async () => {
    const result = await saveReaction({ ...input, value: "dislike" });

    expect(DISLIKE_COOLDOWN_DAYS).toBe(30);
    expect(result.reaction.expiresAt).toBe("2026-09-18T12:00:00.000Z");
    expect(result.match).toBeNull();
  });

  test("repetarea aceleiași reacții este idempotentă", async () => {
    const existingReaction: Reaction = {
      id: "owner-a_owner-b",
      ownerId: "owner-a",
      targetId: "owner-b",
      actorId: "manager-a",
      actorRole: "manager",
      value: "like",
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
    };
    documents.set("reactions/owner-a_owner-b", existingReaction);

    const result = await saveReaction(input);

    expect(result).toEqual({ reaction: existingReaction, match: null });
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  test("nu permite schimbarea unei reacții active prin apăsări concurente", async () => {
    documents.set("reactions/owner-a_owner-b", {
      id: "owner-a_owner-b",
      ownerId: "owner-a",
      targetId: "owner-b",
      actorId: "manager-a",
      actorRole: "manager",
      value: "dislike",
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
      expiresAt: "2026-09-17T12:00:00.000Z",
    });

    await expect(saveReaction(input)).rejects.toThrow(
      "REACTION_ALREADY_RECORDED",
    );
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  test("înlocuiește un dislike expirat când profilul reapare", async () => {
    documents.set("reactions/owner-a_owner-b", {
      id: "owner-a_owner-b",
      ownerId: "owner-a",
      targetId: "owner-b",
      actorId: "old-manager",
      actorRole: "manager",
      value: "dislike",
      createdAt: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      expiresAt: "2026-07-31T12:00:00.000Z",
    });

    const result = await saveReaction(input);

    expect(result.reaction).toEqual(
      expect.objectContaining({
        actorId: "manager-a",
        value: "like",
        createdAt: "2026-08-19T12:00:00.000Z",
      }),
    );
    expect(mockTransactionSet).toHaveBeenCalledTimes(1);
  });

  test("like-ul reciproc creează atomic un singur match determinist", async () => {
    documents.set("reactions/owner-b_owner-a", {
      id: "owner-b_owner-a",
      ownerId: "owner-b",
      targetId: "owner-a",
      actorId: "manager-b",
      actorRole: "manager",
      value: "like",
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
    });

    const result = await saveReaction(input);

    const expectedMatch: Match = {
      id: "owner-a_owner-b",
      memberIds: ["owner-a", "owner-b"],
      createdAt: "2026-08-19T12:00:00.000Z",
    };
    expect(result.match).toEqual(expectedMatch);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      "matches/owner-a_owner-b",
      expectedMatch,
    );
    expect(mockTransactionSet).toHaveBeenCalledTimes(3);
  });

  test("returnează match-ul existent fără o a doua scriere", async () => {
    const existingReaction: Reaction = {
      id: "owner-a_owner-b",
      ownerId: "owner-a",
      targetId: "owner-b",
      actorId: "manager-a",
      actorRole: "manager",
      value: "like",
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
    };
    const existingMatch: Match = {
      id: "owner-a_owner-b",
      memberIds: ["owner-a", "owner-b"],
      createdAt: "2026-08-18T12:01:00.000Z",
    };
    documents.set("reactions/owner-a_owner-b", existingReaction);
    documents.set("matches/owner-a_owner-b", existingMatch);

    await expect(saveReaction(input)).resolves.toEqual({
      reaction: existingReaction,
      match: existingMatch,
    });
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  test("refuză reacția dacă actorul nu este managerul ownerului", async () => {
    await expect(
      saveReaction({
        ...input,
        actorId: "other-user",
      }),
    ).rejects.toThrow("REACTION_MANAGER_ONLY");
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });
});
