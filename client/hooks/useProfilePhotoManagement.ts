import { useCallback, useEffect, useState } from "react";

import type {
  ProfilePhotoOperation,
  ProfilePhotoPreview,
} from "@/components/ProfilePhotoManager";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import {
  deleteProfilePhoto,
  getPhotoDownloadUrl,
  replaceProfilePhoto,
  uploadProfilePhoto,
} from "@/services/photoStorageService";
import type { ProfilePhoto } from "@/types/photo";
import type { SelectedProfilePhoto } from "@/utils/profilePhotoSelection";

function photoIdFromStoragePath(storagePath: string) {
  const fileName = storagePath.split("/").pop() ?? storagePath;
  return fileName.replace(/\.[^.]+$/, "");
}

function toPreview(
  photo: ProfilePhoto,
  previewUri: string,
): ProfilePhotoPreview {
  return { ...photo, previewUri };
}

export function useProfilePhotoManagement() {
  const { user } = useAuth();
  const { profile, refreshProfile, updateProfile } = useProfile();
  const [photos, setPhotos] = useState<ProfilePhotoPreview[]>([]);
  const [operation, setOperation] = useState<ProfilePhotoOperation | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    if (!user) {
      setPhotos([]);
      setErrorMessage("");
      return () => {
        isCurrent = false;
      };
    }

    if (!profile) {
      return () => {
        isCurrent = false;
      };
    }

    const currentProfile = profile;
    const photoPaths = currentProfile.photoPaths ?? [];

    if (photoPaths.length === 0) {
      if (currentProfile.photoUrl) {
        const legacyStoragePath =
          currentProfile.primaryPhotoPath ?? `profile-images/${user.uid}/avatar`;
        setPhotos([
          {
            id: photoIdFromStoragePath(legacyStoragePath),
            storagePath: legacyStoragePath,
            position: 0,
            isPrimary: true,
            previewUri: currentProfile.photoUrl,
          },
        ]);
      } else {
        setPhotos([]);
      }
      setErrorMessage("");

      return () => {
        isCurrent = false;
      };
    }

    async function resolvePreviews() {
      let failedPreviews = 0;
      const previews = await Promise.all(
        photoPaths.map(async (storagePath, position) => {
          const isPrimary = currentProfile.primaryPhotoPath === storagePath;

          try {
            const previewUri =
              isPrimary && currentProfile.photoUrl
                ? currentProfile.photoUrl
                : await getPhotoDownloadUrl(storagePath);

            return {
              id: photoIdFromStoragePath(storagePath),
              storagePath,
              position,
              isPrimary,
              previewUri,
            } satisfies ProfilePhotoPreview;
          } catch (error) {
            failedPreviews += 1;
            console.info("Previzualizarea fotografiei nu a putut fi încărcată:", error);

            return {
              id: photoIdFromStoragePath(storagePath),
              storagePath,
              position,
              isPrimary,
              previewUri: "",
            } satisfies ProfilePhotoPreview;
          }
        }),
      );

      if (!isCurrent) return;

      setPhotos(previews);
      setErrorMessage(
        failedPreviews > 0
          ? "Unele fotografii nu au putut fi previzualizate. Poți încerca din nou mai târziu."
          : "",
      );
    }

    void resolvePreviews();

    return () => {
      isCurrent = false;
    };
  }, [
    profile,
    user,
  ]);

  const runOperation = useCallback(
    async <T,>(
      nextOperation: ProfilePhotoOperation,
      action: () => Promise<T>,
    ) => {
      setOperation(nextOperation);
      setErrorMessage("");

      try {
        return await action();
      } finally {
        setOperation(null);
      }
    },
    [],
  );

  const onAddPhoto = useCallback(
    async (selectedPhoto: SelectedProfilePhoto) => {
      if (!user) throw new Error("AUTH_REQUIRED");

      await runOperation({ kind: "upload" }, async () => {
        const result = await uploadProfilePhoto(
          user.uid,
          selectedPhoto.uri,
          selectedPhoto.mimeType,
          photos.length === 0,
        );

        setPhotos((currentPhotos) => [
          ...currentPhotos,
          toPreview(result.photo, result.downloadUrl),
        ]);
        await refreshProfile(user.uid);
      });
    },
    [photos.length, refreshProfile, runOperation, user],
  );

  const onReplacePhoto = useCallback(
    async (photoId: string, selectedPhoto: SelectedProfilePhoto) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      const targetPhoto = photos.find((photo) => photo.id === photoId);

      if (!targetPhoto) throw new Error("PHOTO_NOT_FOUND");

      await runOperation({ kind: "replace", photoId }, async () => {
        const result = await replaceProfilePhoto(
          user.uid,
          targetPhoto.storagePath,
          selectedPhoto.uri,
          selectedPhoto.mimeType,
        );

        setPhotos((currentPhotos) =>
          currentPhotos.map((photo) =>
            photo.id === photoId
              ? toPreview(result.photo, result.downloadUrl)
              : photo,
          ),
        );
        await refreshProfile(user.uid);
      });
    },
    [photos, refreshProfile, runOperation, user],
  );

  const onRemovePhoto = useCallback(
    async (photoId: string) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      const targetPhoto = photos.find((photo) => photo.id === photoId);

      if (!targetPhoto) throw new Error("PHOTO_NOT_FOUND");

      await runOperation({ kind: "delete", photoId }, async () => {
        await deleteProfilePhoto(user.uid, targetPhoto.storagePath);
        setPhotos((currentPhotos) =>
          currentPhotos
            .filter((photo) => photo.id !== photoId)
            .map((photo, position) => ({
              ...photo,
              position,
              isPrimary: targetPhoto.isPrimary
                ? position === 0
                : photo.isPrimary,
            })),
        );

        const isLegacyPhoto =
          !(profile?.photoPaths ?? []).includes(targetPhoto.storagePath);

        if (isLegacyPhoto) {
          await updateProfile({
            photoUrl: "",
            photoPaths: [],
            primaryPhotoPath: "",
          });
        } else {
          await refreshProfile(user.uid);
        }
      });
    },
    [photos, profile?.photoPaths, refreshProfile, runOperation, updateProfile, user],
  );

  const onSetPrimaryPhoto = useCallback(
    async (photoId: string) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      const targetPhoto = photos.find((photo) => photo.id === photoId);

      if (!targetPhoto) throw new Error("PHOTO_NOT_FOUND");
      if (targetPhoto.isPrimary) return;

      await runOperation({ kind: "set-primary", photoId }, async () => {
        const photoUrl =
          targetPhoto.previewUri ||
          (await getPhotoDownloadUrl(targetPhoto.storagePath));

        await updateProfile({
          primaryPhotoPath: targetPhoto.storagePath,
          photoUrl,
        });
        setPhotos((currentPhotos) =>
          currentPhotos.map((photo) => ({
            ...photo,
            isPrimary: photo.id === photoId,
          })),
        );
      });
    },
    [photos, runOperation, updateProfile, user],
  );

  return {
    photos,
    operation,
    errorMessage,
    onAddPhoto,
    onReplacePhoto,
    onRemovePhoto,
    onSetPrimaryPhoto,
  };
}
