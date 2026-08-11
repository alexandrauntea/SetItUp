import { doc, getDoc } from "firebase/firestore";

import type { FriendRequest, PublicProfile } from "@/types/social";
import {
  getPublicProfileByUid,
  normalizeSearchUsername,
  searchUserByUsername,
} from "../userSearchService";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("@/services/firebase", () => ({
  db: { name: "test-db" },
}));

const mockedDoc = jest.mocked(doc);
const mockedGetDoc = jest.mocked(getDoc);

const publicProfile: PublicProfile = {
  uid: "target-uid",
  username: "anca_21",
  firstName: "Anca",
  lastName: "Popescu",
  occupation: "Studentă",
  gender: "female",
  description: "Îmi plac muzica și călătoriile.",
  interests: ["Muzică", "Călătorii"],
  age: 21,
  isPrivate: false,
  updatedAt: "2026-08-10T10:00:00.000Z",
};

function existingSnapshot(data: object) {
  return {
    exists: () => true,
    data: () => data,
  } as never;
}

function missingSnapshot() {
  return {
    exists: () => false,
  } as never;
}

function prepareVisibleUserSearch() {
  mockedGetDoc
    .mockResolvedValueOnce(existingSnapshot({ uid: "target-uid" }))
    .mockResolvedValueOnce(existingSnapshot(publicProfile));
}

describe("Serviciul de căutare a utilizatorilor", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedDoc.mockImplementation((...args: unknown[]) =>
      args.slice(1).join("/") as never,
    );
  });

  describe("normalizeSearchUsername", () => {
    test("elimină spațiile și transformă literele în litere mici", () => {
      expect(normalizeSearchUsername("  Anca_21  ")).toBe("anca_21");
    });

    test("returnează text gol când primește doar spații", () => {
      expect(normalizeSearchUsername("   ")).toBe("");
    });
  });

  test("nu interoghează Firestore pentru o căutare goală", async () => {
    await expect(searchUserByUsername("current-uid", "   ")).resolves.toBeNull();
    expect(mockedGetDoc).not.toHaveBeenCalled();
  });

  test("încarcă un profil public direct după uid", async () => {
    mockedGetDoc.mockResolvedValueOnce(existingSnapshot(publicProfile));

    await expect(getPublicProfileByUid("target-uid")).resolves.toEqual(
      publicProfile,
    );
    expect(mockedDoc).toHaveBeenCalledWith(
      expect.anything(),
      "publicProfiles",
      "target-uid",
    );
  });

  test("nu interoghează Firestore când uid-ul este gol", async () => {
    await expect(getPublicProfileByUid("   ")).resolves.toBeNull();
    expect(mockedGetDoc).not.toHaveBeenCalled();
  });

  test("returnează null când username-ul nu există", async () => {
    mockedGetDoc.mockResolvedValueOnce(missingSnapshot());

    await expect(
      searchUserByUsername("current-uid", "necunoscut"),
    ).resolves.toBeNull();

    expect(mockedDoc).toHaveBeenCalledWith(
      expect.anything(),
      "usernames",
      "necunoscut",
    );
  });

  test("oprește căutarea propriului cont", async () => {
    mockedGetDoc.mockResolvedValueOnce(
      existingSnapshot({ uid: "current-uid" }),
    );

    await expect(
      searchUserByUsername("current-uid", "andrei"),
    ).rejects.toThrow("CANNOT_SEARCH_SELF");

    expect(mockedGetDoc).toHaveBeenCalledTimes(1);
  });

  test("returnează profilul public fără o relație existentă", async () => {
    prepareVisibleUserSearch();
    mockedGetDoc
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(missingSnapshot());

    await expect(
      searchUserByUsername("current-uid", " Anca_21 "),
    ).resolves.toEqual({
      uid: "target-uid",
      username: "anca_21",
      isPrivate: false,
      profile: publicProfile,
      relationshipState: "none",
    });
  });

  test("recunoaște un utilizator care este deja prieten", async () => {
    prepareVisibleUserSearch();
    mockedGetDoc
      .mockResolvedValueOnce(existingSnapshot({
        memberIds: ["current-uid", "target-uid"],
      }))
      .mockResolvedValueOnce(missingSnapshot());

    const result = await searchUserByUsername("current-uid", "anca_21");

    expect(result?.relationshipState).toBe("friends");
  });

  test("recunoaște o cerere trimisă de utilizatorul curent", async () => {
    const request: FriendRequest = {
      id: "current-uid_target-uid",
      senderId: "current-uid",
      senderUsername: "andrei",
      receiverId: "target-uid",
      receiverUsername: "anca_21",
      memberIds: ["current-uid", "target-uid"],
      status: "pending",
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-08-10T10:00:00.000Z",
    };

    prepareVisibleUserSearch();
    mockedGetDoc
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(existingSnapshot(request));

    const result = await searchUserByUsername("current-uid", "anca_21");

    expect(result?.relationshipState).toBe("request-sent");
  });

  test("recunoaște o cerere primită de utilizatorul curent", async () => {
    const request: FriendRequest = {
      id: "current-uid_target-uid",
      senderId: "target-uid",
      senderUsername: "anca_21",
      receiverId: "current-uid",
      receiverUsername: "andrei",
      memberIds: ["current-uid", "target-uid"],
      status: "pending",
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-08-10T10:00:00.000Z",
    };

    prepareVisibleUserSearch();
    mockedGetDoc
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(existingSnapshot(request));

    const result = await searchUserByUsername("current-uid", "anca_21");

    expect(result?.relationshipState).toBe("request-received");
  });

  test("ascunde datele unui profil privat", async () => {
    mockedGetDoc
      .mockResolvedValueOnce(existingSnapshot({ uid: "target-uid" }))
      .mockRejectedValueOnce({ code: "permission-denied" })
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(missingSnapshot());

    await expect(
      searchUserByUsername("current-uid", "anca_21"),
    ).resolves.toEqual({
      uid: "target-uid",
      username: "anca_21",
      isPrivate: true,
      profile: null,
      relationshipState: "none",
    });
  });
});
