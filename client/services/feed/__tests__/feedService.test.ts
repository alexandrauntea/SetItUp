import type { FeedPreferences } from "@/types/feed";
import type { PublicProfile } from "@/types/social";
import { getFeed, matchesFeedPreferences } from "../feedService";

jest.mock("@/services/firebase", () => ({ db: {} }));

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((db: unknown, name: string) => `collection:${name}`),
  doc: jest.fn((db: unknown, name: string, id: string) => `doc:${name}:${id}`),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  where: jest.fn((field: string, operator: string, value: string | boolean) =>
    `${field}:${operator}:${value}`,
  ),
  query: jest.fn((collectionReference: string, constraint: string) =>
    `${collectionReference}|${constraint}`,
  ),
}));

const preferences: FeedPreferences = {
  ownerId: "owner",
  minAge: 20,
  maxAge: 35,
  genders: ["female"],
  interests: ["travel"],
  updatedAt: "2026-08-15T10:00:00.000Z",
};

function profile(
  uid: string,
  overrides: Partial<PublicProfile> = {},
): PublicProfile {
  return {
    uid,
    username: uid,
    firstName: uid,
    lastName: "Test",
    occupation: "Tester",
    gender: "female",
    description: "Profile",
    interests: ["Travel"],
    age: 25,
    isPrivate: false,
    updatedAt: "2026-08-15T10:00:00.000Z",
    ...overrides,
  };
}

function snapshot(data: unknown[]) {
  return { docs: data.map((value) => ({ data: () => value })) };
}

describe("feedService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("matches age, gender and at least one normalized interest", () => {
    expect(matchesFeedPreferences(profile("candidate"), preferences)).toBe(true);
    expect(matchesFeedPreferences(
      profile("too-old", { age: 40 }),
      preferences,
    )).toBe(false);
    expect(matchesFeedPreferences(
      profile("other-interest", { interests: ["Music"] }),
      preferences,
    )).toBe(false);
  });

  test("only the active manager can request an owner's feed", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ownerId: "owner", managerId: "actual-manager" }),
    });

    await expect(getFeed({
      ownerId: "owner",
      actorId: "other-user",
      preferences,
    })).rejects.toThrow("FEED_MANAGER_ONLY");

    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  test("exclude profilurile neeligibile și afișează numai profilurile compatibile", async () => {
    const preferred = Array.from({ length: 10 }, (_, index) =>
      profile(`preferred-${index}`),
    );
    const random = Array.from({ length: 4 }, (_, index) =>
      profile(`random-${index}`, { interests: ["Music"] }),
    );
    const excluded = [
      profile("owner"),
      profile("manager"),
      profile("friend"),
      profile("liked"),
      profile("matched"),
      profile("unmanaged"),
      profile("same-manager"),
      profile("private", { isPrivate: true }),
    ];

    mockGetDoc.mockImplementation(async (reference: string) => {
      if (reference === "doc:managerRelationships:owner") {
        return {
          exists: () => true,
          data: () => ({ ownerId: "owner", managerId: "manager" }),
        };
      }
      if (reference === "doc:managerRoles:unmanaged") {
        return { exists: () => false };
      }
      const uid = reference.split(":").at(-1);
      return {
        exists: () => true,
        data: () => ({
          uid,
          role: "owner",
          counterpartId: uid === "same-manager" ? "manager" : `manager-${uid}`,
        }),
      };
    });
    mockGetDocs.mockImplementation(async (reference: string) => {
      if (reference === "collection:publicProfiles|isPrivate:==:false") {
        return snapshot([...preferred, ...random, ...excluded]);
      }
      if (reference === "collection:friendships|memberIds:array-contains:owner") {
        return snapshot([{ memberIds: ["owner", "friend"] }]);
      }
      if (reference === "collection:reactions|ownerId:==:owner") {
        return snapshot([{
          ownerId: "owner",
          targetId: "liked",
          value: "like",
        }]);
      }
      if (reference === "collection:matches|memberIds:array-contains:owner") {
        return snapshot([{ memberIds: ["owner", "matched"] }]);
      }
      return snapshot([]);
    });

    const firstPage = await getFeed({
      ownerId: "owner",
      actorId: "manager",
      preferences,
      limit: 10,
    });

    expect(firstPage.profiles).toHaveLength(10);
    expect(firstPage.profiles.every((item) => item.matchesPreferences)).toBe(true);
    expect(firstPage.profiles.map((item) => item.uid)).not.toEqual(
      expect.arrayContaining([
        "owner",
        "manager",
        "friend",
        "liked",
        "matched",
        "unmanaged",
        "same-manager",
        "private",
      ]),
    );
    expect(firstPage.nextCursor).toBeNull();
  });

  test("afișează toate profilurile eligibile ca rezervă când niciunul nu respectă filtrele", async () => {
    const fallbackProfiles = [
      profile("fallback-1", { interests: ["Music"] }),
      profile("fallback-2", { gender: "male", interests: ["Sport"] }),
    ];

    mockGetDoc.mockImplementation(async (reference: string) => {
      if (reference === "doc:managerRelationships:owner") {
        return {
          exists: () => true,
          data: () => ({ ownerId: "owner", managerId: "manager" }),
        };
      }
      const uid = reference.split(":").at(-1);
      return {
        exists: () => true,
        data: () => ({ uid, role: "owner", counterpartId: `manager-${uid}` }),
      };
    });
    mockGetDocs.mockImplementation(async (reference: string) => {
      if (reference === "collection:publicProfiles|isPrivate:==:false") {
        return snapshot(fallbackProfiles);
      }
      return snapshot([]);
    });

    const page = await getFeed({
      ownerId: "owner",
      actorId: "manager",
      preferences,
    });

    expect(page.profiles).toHaveLength(2);
    expect(page.profiles.every((item) => !item.matchesPreferences)).toBe(true);
  });

  test("îl recomandă pe Bogdan lui Andrei când sunt gestionați de Denis și Eric", async () => {
    const bogdan = profile("bogdan", {
      username: "bogdan",
      interests: ["Music"],
    });

    mockGetDoc.mockImplementation(async (reference: string) => {
      if (reference === "doc:managerRelationships:andrei") {
        return {
          exists: () => true,
          data: () => ({ ownerId: "andrei", managerId: "denis" }),
        };
      }
      if (reference === "doc:managerRoles:bogdan") {
        return {
          exists: () => true,
          data: () => ({ uid: "bogdan", role: "owner", counterpartId: "eric" }),
        };
      }
      return { exists: () => false };
    });
    mockGetDocs.mockImplementation(async (reference: string) => {
      if (reference === "collection:publicProfiles|isPrivate:==:false") {
        return snapshot([bogdan]);
      }
      return snapshot([]);
    });

    const page = await getFeed({
      ownerId: "andrei",
      actorId: "denis",
      preferences: { ...preferences, ownerId: "andrei" },
    });

    expect(page.profiles.map((item) => item.uid)).toEqual(["bogdan"]);
  });

  test("rejects malformed cursors and unsafe page sizes", async () => {
    await expect(getFeed({
      ownerId: "owner",
      actorId: "manager",
      preferences,
      limit: 0,
    })).rejects.toThrow("INVALID_FEED_LIMIT");

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ownerId: "owner", managerId: "manager" }),
    });
    mockGetDocs.mockResolvedValue(snapshot([]));

    await expect(getFeed({
      ownerId: "owner",
      actorId: "manager",
      preferences,
      cursor: "invalid",
    })).rejects.toThrow("INVALID_FEED_CURSOR");
  });
});
