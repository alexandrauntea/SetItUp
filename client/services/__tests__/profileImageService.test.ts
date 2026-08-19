import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { uploadProfilePhoto } from "../profileImageService";

jest.mock("firebase/storage", () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, col, id) => `${col}/${id}`),
  runTransaction: jest.fn(async (_db, cb) => {
    return cb({
      get: jest.fn().mockReturnValue({ exists: () => true, data: () => ({ photoPaths: [] }) }),
      update: jest.fn(),
    });
  }),
}));

jest.mock("../firebase", () => ({
  storage: { name: "test-storage" },
  db: { name: "test-db" },
}));

const mockedGetDownloadURL = jest.mocked(getDownloadURL);
const mockedRef = jest.mocked(ref);
const mockedUploadBytes = jest.mocked(uploadBytes);
const mockedFetch = jest.fn();

describe("Încărcarea pozei de profil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockedFetch;
    mockedRef.mockReturnValue("photo-reference" as never);
    mockedUploadBytes.mockResolvedValue({} as never);
    mockedGetDownloadURL.mockResolvedValue(
      "https://example.com/profile-photo.jpg",
    );
  });

  test("încarcă fotografia în folderul utilizatorului și returnează URL-ul", async () => {
    const blob = { type: "image/png" } as Blob;
    mockedFetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
    });

    await expect(
      uploadProfilePhoto("user-123", "file:///photo.png", "image/png"),
    ).resolves.toBe("https://example.com/profile-photo.jpg");

    expect(mockedFetch).toHaveBeenCalledWith("file:///photo.png");
    expect(mockedUploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      blob,
      { contentType: "image/png" },
    );
  });

  test("folosește tipul fișierului când mimeType nu este primit", async () => {
    const blob = { type: "image/webp" } as Blob;
    mockedFetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
    });

    await uploadProfilePhoto("user-123", "file:///photo.webp");

    expect(mockedUploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      blob,
      { contentType: "image/webp" },
    );
  });

  test("oprește încărcarea dacă fotografia locală nu poate fi citită", async () => {
    mockedFetch.mockResolvedValue({ ok: false });

    await expect(
      uploadProfilePhoto("user-123", "file:///missing.jpg"),
    ).rejects.toThrow("PHOTO_READ_FAILED");

    expect(mockedUploadBytes).not.toHaveBeenCalled();
    expect(mockedGetDownloadURL).not.toHaveBeenCalled();
  });
});
