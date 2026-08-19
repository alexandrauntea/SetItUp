import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useProfilePhotoManagement } from "@/hooks/useProfilePhotoManagement";
import {
  deleteProfilePhoto,
  getPhotoDownloadUrl,
  replaceProfilePhoto,
  uploadProfilePhoto,
} from "@/services/photoStorageService";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: jest.fn(),
}));

jest.mock("@/services/photoStorageService", () => ({
  deleteProfilePhoto: jest.fn(),
  getPhotoDownloadUrl: jest.fn(),
  replaceProfilePhoto: jest.fn(),
  uploadProfilePhoto: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedDeleteProfilePhoto = jest.mocked(deleteProfilePhoto);
const mockedGetPhotoDownloadUrl = jest.mocked(getPhotoDownloadUrl);
const mockedReplaceProfilePhoto = jest.mocked(replaceProfilePhoto);
const mockedUploadProfilePhoto = jest.mocked(uploadProfilePhoto);

const refreshProfile = jest.fn();
const updateProfile = jest.fn();
const primaryPath = "profilePhotos/user-123/primary.jpg";
const secondaryPath = "profilePhotos/user-123/secondary.jpg";

const savedProfile = {
  uid: "user-123",
  photoPaths: [primaryPath, secondaryPath],
  primaryPhotoPath: primaryPath,
  photoUrl: "https://exemplu.ro/primary.jpg",
};

describe("useProfilePhotoManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-123" },
    } as never);
    mockedUseProfile.mockReturnValue({
      profile: savedProfile,
      refreshProfile,
      updateProfile,
    } as never);
    mockedGetPhotoDownloadUrl.mockImplementation(async (storagePath) =>
      `https://exemplu.ro/${storagePath.split("/").pop()}`,
    );
    refreshProfile.mockResolvedValue(undefined);
    updateProfile.mockResolvedValue(undefined);
    mockedDeleteProfilePhoto.mockResolvedValue(undefined);
  });

  test("încarcă previzualizările în ordinea salvată în profil", async () => {
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => {
      expect(result.current.photos).toHaveLength(2);
    });

    expect(result.current.photos[0]).toMatchObject({
      id: "primary",
      storagePath: primaryPath,
      position: 0,
      isPrimary: true,
      previewUri: "https://exemplu.ro/primary.jpg",
    });
    expect(result.current.photos[1]).toMatchObject({
      id: "secondary",
      storagePath: secondaryPath,
      position: 1,
      isPrimary: false,
      previewUri: "https://exemplu.ro/secondary.jpg",
    });
    expect(mockedGetPhotoDownloadUrl).toHaveBeenCalledWith(secondaryPath);
  });

  test("încarcă o fotografie nouă și reîmprospătează profilul", async () => {
    mockedUploadProfilePhoto.mockResolvedValue({
      photo: {
        id: "new-photo",
        storagePath: "profilePhotos/user-123/new-photo.jpg",
        position: 2,
        isPrimary: false,
      },
      downloadUrl: "https://exemplu.ro/new-photo.jpg",
    });
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      await result.current.onAddPhoto({
        uri: "file:///new-photo.jpg",
        mimeType: "image/jpeg",
      });
    });

    expect(mockedUploadProfilePhoto).toHaveBeenCalledWith(
      "user-123",
      "file:///new-photo.jpg",
      "image/jpeg",
      false,
    );
    expect(refreshProfile).toHaveBeenCalledWith("user-123");
    expect(result.current.operation).toBeNull();
  });

  test("înlocuiește fotografia indicată prin calea ei Storage", async () => {
    mockedReplaceProfilePhoto.mockResolvedValue({
      photo: {
        id: "replacement",
        storagePath: "profilePhotos/user-123/replacement.jpg",
        position: 1,
        isPrimary: false,
      },
      downloadUrl: "https://exemplu.ro/replacement.jpg",
    });
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      await result.current.onReplacePhoto("secondary", {
        uri: "file:///replacement.jpg",
        mimeType: "image/png",
      });
    });

    expect(mockedReplaceProfilePhoto).toHaveBeenCalledWith(
      "user-123",
      secondaryPath,
      "file:///replacement.jpg",
      "image/png",
    );
    expect(refreshProfile).toHaveBeenCalledWith("user-123");
  });

  test("elimină fotografia și reîncarcă profilul", async () => {
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      await result.current.onRemovePhoto("secondary");
    });

    expect(mockedDeleteProfilePhoto).toHaveBeenCalledWith(
      "user-123",
      secondaryPath,
    );
    expect(refreshProfile).toHaveBeenCalledWith("user-123");
  });

  test("actualizează fotografia principală și URL-ul public", async () => {
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      await result.current.onSetPrimaryPhoto("secondary");
    });

    expect(updateProfile).toHaveBeenCalledWith({
      primaryPhotoPath: secondaryPath,
      photoUrl: "https://exemplu.ro/secondary.jpg",
    });
    expect(result.current.photos[1].isPrimary).toBe(true);
    expect(result.current.photos[0].isPrimary).toBe(false);
  });

  test("afișează o eroare în română dacă o previzualizare nu se încarcă", async () => {
    mockedGetPhotoDownloadUrl.mockRejectedValueOnce(
      new Error("storage/object-not-found"),
    );
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    const { result } = await renderHook(() => useProfilePhotoManagement());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        "Unele fotografii nu au putut fi previzualizate. Poți încerca din nou mai târziu.",
      );
    });

    consoleSpy.mockRestore();
  });
});
