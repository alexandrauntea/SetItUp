import { auth } from "@/services/firebase";
import { listMatches } from "../matchService";

jest.mock("@/services/firebase", () => ({
  auth: { currentUser: { uid: "manager-a" } },
  db: {},
}));

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockWhere = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((db: unknown, name: string) => `collection:${name}`),
  doc: jest.fn((db: unknown, name: string, id: string) => `doc:${name}:${id}`),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: jest.fn(
    (reference: string, constraint: string) => `${reference}|${constraint}`,
  ),
  where: (...args: unknown[]) => mockWhere(...args),
}));

function relationshipSnapshot(managerId = "manager-a") {
  return {
    exists: () => true,
    data: () => ({ ownerId: "owner-a", managerId }),
  };
}

function matchesSnapshot(matches: Array<{ id: string; data: unknown }>) {
  return {
    docs: matches.map((match) => ({
      id: match.id,
      data: () => match.data,
    })),
  };
}

describe("matchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(auth, "currentUser", {
      configurable: true,
      value: { uid: "manager-a" },
      writable: true,
    });
    mockWhere.mockReturnValue("memberIds:array-contains:owner-a");
    mockGetDoc.mockResolvedValue(relationshipSnapshot());
    mockGetDocs.mockResolvedValue(matchesSnapshot([]));
  });

  test("listează numai match-urile ownerului și le sortează descrescător", async () => {
    mockGetDocs.mockResolvedValue(
      matchesSnapshot([
        {
          id: "owner-a_owner-b",
          data: {
            id: "ignored-id",
            memberIds: ["owner-a", "owner-b"],
            createdAt: "2026-08-18T10:00:00.000Z",
          },
        },
        {
          id: "owner-a_owner-c",
          data: {
            memberIds: ["owner-a", "owner-c"],
            createdAt: "2026-08-19T10:00:00.000Z",
          },
        },
      ]),
    );

    const matches = await listMatches("owner-a");

    expect(mockWhere).toHaveBeenCalledWith(
      "memberIds",
      "array-contains",
      "owner-a",
    );
    expect(matches.map((match) => match.id)).toEqual([
      "owner-a_owner-c",
      "owner-a_owner-b",
    ]);
  });

  test("refuză accesul unei persoane care nu este managerul ownerului", async () => {
    mockGetDoc.mockResolvedValue(relationshipSnapshot("manager-b"));

    await expect(listMatches("owner-a")).rejects.toThrow(
      "MATCHES_MANAGER_ONLY",
    );
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  test("cere o sesiune autentificată", async () => {
    Object.defineProperty(auth, "currentUser", {
      configurable: true,
      value: null,
      writable: true,
    });

    await expect(listMatches("owner-a")).rejects.toThrow("AUTH_REQUIRED");
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  test("respinge documentele match invalide", async () => {
    mockGetDocs.mockResolvedValue(
      matchesSnapshot([
        {
          id: "broken-match",
          data: {
            memberIds: ["owner-b", "owner-c"],
            createdAt: "invalid-date",
          },
        },
      ]),
    );

    await expect(listMatches("owner-a")).rejects.toThrow("INVALID_MATCH_DATA");
  });

  test("propagă erorile Firestore pentru ca ecranul să permită retry", async () => {
    mockGetDocs.mockRejectedValue(new Error("unavailable"));

    await expect(listMatches("owner-a")).rejects.toThrow("unavailable");
  });
});
