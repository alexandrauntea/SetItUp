import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { uploadProfilePhoto } from "../profileImageService";

jest.mock("firebase/storage", () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock("../firebase", () => ({
  storage: { name: "test-storage" },
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
    expect(mockedRef).toHaveBeenCalledWith(
      expect.anything(),
      "profile-images/user-123/avatar",
    );
    expect(mockedUploadBytes).toHaveBeenCalledWith(
      "photo-reference",
      blob,
      { contentType: "image/png" },
    );
    expect(mockedGetDownloadURL).toHaveBeenCalledWith("photo-reference");
  });

  test("folosește tipul fișierului când mimeType nu este primit", async () => {
    const blob = { type: "image/webp" } as Blob;
    mockedFetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
    });

    await uploadProfilePhoto("user-123", "file:///photo.webp");

    expect(mockedUploadBytes).toHaveBeenCalledWith(
      "photo-reference",
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
