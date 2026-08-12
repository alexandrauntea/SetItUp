import {
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";

import type { CreateUserProfileInput, UserProfile } from "@/types/profile";
import {
  createUserProfile,
  getUserProfile,
  isUsernameAvailable,
  normalizeUsername,
  updateUserProfile,
} from "../profileService";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("../firebase", () => ({
  db: { name: "test-db" },
}));

const mockedDoc = jest.mocked(doc);
const mockedGetDoc = jest.mocked(getDoc);
const mockedRunTransaction = jest.mocked(runTransaction);

const input: CreateUserProfileInput = {
  uid: "user-123",
  username: "  Andrei_21  ",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  occupation: "Student",
  gender: "male",
  description: "Îmi place tehnologia.",
  interests: ["Tehnologie"],
  isPrivate: false,
  gdprAcceptedAt: "2026-08-01T10:00:00.000Z",
  profileCompleted: true,
};

describe("Serviciul de profil", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedDoc.mockImplementation((...args: unknown[]) =>
      args.slice(1).join("/") as never,
    );
  });

  describe("normalizeUsername", () => {
    test("transformă literele mari în litere mici", () => {
      expect(normalizeUsername("Andrei_21")).toBe("andrei_21");
    });

    test("elimină spațiile de la început și sfârșit", () => {
      expect(normalizeUsername("  andrei  ")).toBe("andrei");
    });

    test("returnează text gol dacă primește doar spații", () => {
      expect(normalizeUsername("   ")).toBe("");
    });
  });

  describe("isUsernameAvailable", () => {
    test("returnează true când username-ul nu există", async () => {
      mockedGetDoc.mockResolvedValue({ exists: () => false } as never);

      await expect(isUsernameAvailable(" Andrei_21 ")).resolves.toBe(true);

      expect(mockedDoc).toHaveBeenCalledWith(
        expect.anything(),
        "usernames",
        "andrei_21",
      );
    });

    test("returnează false când username-ul există", async () => {
      mockedGetDoc.mockResolvedValue({ exists: () => true } as never);

      await expect(isUsernameAvailable("andrei_21")).resolves.toBe(false);
    });
  });

  describe("createUserProfile", () => {
    test("rezervă username-ul și creează profilul în aceeași tranzacție", async () => {
      const transaction = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_database, callback) => {
        return callback(transaction as never);
      });

      const result = await createUserProfile(input);

      expect(result.username).toBe("andrei_21");
      expect(result.createdAt).toEqual(expect.any(String));
      expect(result.updatedAt).toBe(result.createdAt);
      expect(transaction.get).toHaveBeenCalledWith("usernames/andrei_21");
      expect(transaction.set).toHaveBeenNthCalledWith(
        1,
        "usernames/andrei_21",
        {
          uid: "user-123",
          createdAt: result.createdAt,
        },
      );
      expect(transaction.set).toHaveBeenNthCalledWith(
        2,
        "users/user-123",
        result,
      );
      expect(transaction.set).toHaveBeenNthCalledWith(
        3,
        "publicProfiles/user-123",
        expect.objectContaining({
          uid: "user-123",
          username: "andrei_21",
          firstName: "Andrei",
          lastName: "Barbuceanu",
          age: expect.any(Number),
        }),
      );
    });

    test("oprește crearea când username-ul este deja rezervat", async () => {
      const transaction = {
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        set: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_database, callback) => {
        return callback(transaction as never);
      });

      await expect(createUserProfile(input)).rejects.toThrow("USERNAME_TAKEN");
      expect(transaction.set).not.toHaveBeenCalled();
    });
  });

  describe("getUserProfile", () => {
    test("returnează null când documentul nu există", async () => {
      mockedGetDoc.mockResolvedValue({ exists: () => false } as never);

      await expect(getUserProfile("user-123")).resolves.toBeNull();
    });

    test("returnează datele profilului când documentul există", async () => {
      const savedProfile = {
        ...input,
        username: "andrei_21",
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
      } satisfies UserProfile;

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => savedProfile,
      } as never);

      await expect(getUserProfile("user-123")).resolves.toEqual(savedProfile);
      expect(mockedDoc).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        "user-123",
      );
    });
  });

  describe("updateUserProfile", () => {
    test("actualizează câmpurile și data ultimei modificări", async () => {
      const savedProfile = {
        ...input,
        username: "andrei_21",
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
      } satisfies UserProfile;
      const transaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => savedProfile,
        }),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_database, callback) =>
        callback(transaction as never),
      );

      await updateUserProfile("user-123", {
        occupation: "Developer",
        interests: ["Tehnologie", "Muzică"],
      });

      expect(transaction.get).toHaveBeenCalledWith("users/user-123");
      expect(transaction.update).toHaveBeenCalledWith("users/user-123", {
        occupation: "Developer",
        interests: ["Tehnologie", "Muzică"],
        updatedAt: expect.any(String),
      });
      expect(transaction.set).toHaveBeenCalledWith(
        "publicProfiles/user-123",
        expect.objectContaining({
          occupation: "Developer",
          interests: ["Tehnologie", "Muzică"],
        }),
      );
    });

    test("oprește actualizarea dacă profilul privat lipsește", async () => {
      const transaction = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_database, callback) =>
        callback(transaction as never),
      );

      await expect(
        updateUserProfile("user-123", { occupation: "Developer" }),
      ).rejects.toThrow("PROFILE_NOT_FOUND");
      expect(transaction.update).not.toHaveBeenCalled();
      expect(transaction.set).not.toHaveBeenCalled();
    });

    test("transmite mai departe eroarea Firestore", async () => {
      const firestoreError = new Error("permission-denied");
      mockedRunTransaction.mockRejectedValueOnce(firestoreError);

      await expect(
        updateUserProfile("user-123", { occupation: "Developer" }),
      ).rejects.toBe(firestoreError);
    });
  });
});
