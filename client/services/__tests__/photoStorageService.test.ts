import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { runTransaction } from "firebase/firestore";
import {
  deleteProfilePhoto,
  getPhotoDownloadUrl,
  replaceProfilePhoto,
  uploadProfilePhoto,
} from "../photoStorageService";

jest.mock("firebase/storage", () => ({
  deleteObject: jest.fn(),
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, col, id) => `${col}/${id}`),
  runTransaction: jest.fn(),
}));

jest.mock("../firebase", () => ({
  storage: { name: "test-storage" },
  db: { name: "test-db" },
}));

const mockedDeleteObject = jest.mocked(deleteObject);
const mockedGetDownloadURL = jest.mocked(getDownloadURL);
const mockedRef = jest.mocked(ref);
const mockedUploadBytes = jest.mocked(uploadBytes);
const mockedRunTransaction = jest.mocked(runTransaction);
const mockedFetch = jest.fn();

describe("Serviciul pentru stocarea fotografiilor de profil (photoStorageService)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockedFetch;
    mockedRef.mockImplementation((_storage, path) => ({ path } as never));
    mockedUploadBytes.mockResolvedValue({} as never);
    mockedDeleteObject.mockResolvedValue(undefined);
    mockedGetDownloadURL.mockResolvedValue(
      "https://firebasestorage.googleapis.com/v0/b/bucket/o/profilePhotos%2Fuser1%2F123.jpg",
    );
  });

  describe("getPhotoDownloadUrl", () => {
    test("obține URL-ul de descărcare pentru o cale din Storage", async () => {
      const url = await getPhotoDownloadUrl("profilePhotos/user1/123.jpg");
      expect(url).toBe(
        "https://firebasestorage.googleapis.com/v0/b/bucket/o/profilePhotos%2Fuser1%2F123.jpg",
      );
      expect(mockedRef).toHaveBeenCalledWith(
        expect.anything(),
        "profilePhotos/user1/123.jpg",
      );
      expect(mockedGetDownloadURL).toHaveBeenCalled();
    });
  });

  describe("uploadProfilePhoto", () => {
    test("încarcă o fotografie în Storage și actualizează Firestore", async () => {
      const blob = { type: "image/jpeg" } as Blob;
      mockedFetch.mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(blob),
      });

      const userDocData = {
        uid: "user1",
        photoPaths: [],
      };

      const mockTransaction = {
        get: jest.fn().mockImplementation((refPath) => {
          if (refPath === "users/user1" || refPath === "publicProfiles/user1") {
            return { exists: () => true, data: () => userDocData };
          }
          return { exists: () => false };
        }),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      const result = await uploadProfilePhoto(
        "user1",
        "file:///local/photo.jpg",
        "image/jpeg",
        true,
      );

      expect(result.downloadUrl).toBe(
        "https://firebasestorage.googleapis.com/v0/b/bucket/o/profilePhotos%2Fuser1%2F123.jpg",
      );
      expect(result.photo.storagePath).toMatch(/^profilePhotos\/user1\/.+\.jpg$/);
      expect(result.photo.position).toBe(0);
      expect(result.photo.isPrimary).toBe(true);

      expect(mockedUploadBytes).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "users/user1",
        expect.objectContaining({
          primaryPhotoPath: result.photo.storagePath,
          photoUrl: result.downloadUrl,
        }),
      );
    });

    test("aruncă eroare PHOTO_READ_FAILED dacă fișierul local nu poate fi citit", async () => {
      mockedFetch.mockResolvedValue({ ok: false });

      await expect(
        uploadProfilePhoto("user1", "file:///invalid/photo.jpg"),
      ).rejects.toThrow("PHOTO_READ_FAILED");

      expect(mockedUploadBytes).not.toHaveBeenCalled();
    });

    test("aruncă eroare PROFILE_NOT_FOUND dacă profilul nu există în Firestore", async () => {
      const blob = { type: "image/jpeg" } as Blob;
      mockedFetch.mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(blob),
      });

      const mockTransaction = {
        get: jest.fn().mockReturnValue({ exists: () => false }),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await expect(
        uploadProfilePhoto("user1", "file:///local/photo.jpg"),
      ).rejects.toThrow("PROFILE_NOT_FOUND");
    });
  });

  describe("deleteProfilePhoto", () => {
    test("șterge fotografia din Storage și din Firestore", async () => {
      const targetPath = "profilePhotos/user1/photo1.jpg";
      const remainingPath = "profilePhotos/user1/photo2.jpg";

      const userDocData = {
        uid: "user1",
        photoPaths: [targetPath, remainingPath],
        primaryPhotoPath: targetPath,
      };

      const mockTransaction = {
        get: jest.fn().mockImplementation((refPath) => {
          if (refPath === "users/user1" || refPath === "publicProfiles/user1") {
            return { exists: () => true, data: () => userDocData };
          }
          return { exists: () => false };
        }),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      await deleteProfilePhoto("user1", targetPath);

      expect(mockedDeleteObject).toHaveBeenCalledWith({ path: targetPath });
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "users/user1",
        expect.objectContaining({
          photoPaths: [remainingPath],
          primaryPhotoPath: remainingPath,
        }),
      );
    });
  });

  describe("replaceProfilePhoto", () => {
    test("înlocuiește o fotografie în Storage și actualizează Firestore la aceeași poziție", async () => {
      const blob = { type: "image/png" } as Blob;
      mockedFetch.mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(blob),
      });

      const targetPath = "profilePhotos/user1/old_photo.jpg";
      const userDocData = {
        uid: "user1",
        photoPaths: [targetPath],
        primaryPhotoPath: targetPath,
      };

      const mockTransaction = {
        get: jest.fn().mockImplementation((refPath) => {
          if (refPath === "users/user1" || refPath === "publicProfiles/user1") {
            return { exists: () => true, data: () => userDocData };
          }
          return { exists: () => false };
        }),
        update: jest.fn(),
      };

      mockedRunTransaction.mockImplementation(async (_db, cb) => {
        return cb(mockTransaction as never);
      });

      const result = await replaceProfilePhoto(
        "user1",
        targetPath,
        "file:///local/new_photo.png",
        "image/png",
      );

      expect(mockedUploadBytes).toHaveBeenCalled();
      expect(mockedDeleteObject).toHaveBeenCalledWith({ path: targetPath });
      expect(result.photo.position).toBe(0);
      expect(result.photo.isPrimary).toBe(true);
      expect(mockTransaction.update).toHaveBeenCalledWith(
        "users/user1",
        expect.objectContaining({
          primaryPhotoPath: result.photo.storagePath,
          photoUrl: result.downloadUrl,
        }),
      );
    });

    test("aruncă eroare PHOTO_READ_FAILED dacă noua fotografie locală nu este disponibilă", async () => {
      mockedFetch.mockResolvedValue({ ok: false });

      await expect(
        replaceProfilePhoto(
          "user1",
          "profilePhotos/user1/old.jpg",
          "file:///invalid/new.jpg",
        ),
      ).rejects.toThrow("PHOTO_READ_FAILED");

      expect(mockedUploadBytes).not.toHaveBeenCalled();
    });
  });
});
