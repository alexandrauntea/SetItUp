import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  deleteField,
  doc,
  runTransaction,
} from "firebase/firestore";
import { storage, db } from "./firebase";
import type { PhotoUploadResult } from "@/types/photo";

function generatePhotoId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function getValidContentType(mimeType?: string | null, blobType?: string | null): string {
  const candidate = mimeType?.trim() || blobType?.trim() || "image/jpeg";

  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(candidate)) {
    throw new Error("PHOTO_TYPE_NOT_SUPPORTED");
  }

  return candidate;
}

function getFileExtension(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function assertOwnedStoragePath(uid: string, storagePath: string): void {
  if (!storagePath.startsWith(`profilePhotos/${uid}/`)) {
    throw new Error("PHOTO_ACCESS_DENIED");
  }
}

export async function getPhotoDownloadUrl(
  storagePath: string,
): Promise<string> {
  const photoRef = ref(storage, storagePath);
  return getDownloadURL(photoRef);
}

export async function uploadProfilePhoto(
  uid: string,
  localUri: string,
  mimeType?: string | null,
  isPrimary?: boolean,
): Promise<PhotoUploadResult> {
  let response: Response;
  try {
    response = await fetch(localUri);
    if (!response.ok) {
      throw new Error("PHOTO_READ_FAILED");
    }
  } catch (err) {
    throw new Error("PHOTO_READ_FAILED");
  }

  const photoBlob = await response.blob();
  const contentType = getValidContentType(mimeType, photoBlob.type);
  const photoId = generatePhotoId();
  const storagePath = `profilePhotos/${uid}/${photoId}.${getFileExtension(contentType)}`;
  const photoRef = ref(storage, storagePath);

  await uploadBytes(photoRef, photoBlob, {
    contentType,
  });

  const downloadUrl = await getDownloadURL(photoRef);

  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);

  let finalPosition = 0;
  let finalIsPrimary = Boolean(isPrimary);

  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const publicSnap = await transaction.get(publicRef);

      if (!userSnap.exists()) {
        throw new Error("PROFILE_NOT_FOUND");
      }
      const data = userSnap.data();
      const existingPaths: string[] = Array.isArray(data.photoPaths)
        ? data.photoPaths
        : [];
      const updatedPaths = [...existingPaths, storagePath];
      finalPosition = existingPaths.length;

      const shouldBePrimary =
        finalIsPrimary || existingPaths.length === 0 || !data.primaryPhotoPath;
      finalIsPrimary = shouldBePrimary;

      const updates: Record<string, unknown> = {
        photoPaths: updatedPaths,
        updatedAt: new Date().toISOString(),
      };

      if (shouldBePrimary) {
        updates.primaryPhotoPath = storagePath;
        updates.photoUrl = downloadUrl;
      }

      transaction.update(userRef, updates);

      if (publicSnap.exists()) {
        const publicUpdates: Record<string, unknown> = {
          photoPaths: updatedPaths,
          updatedAt: new Date().toISOString(),
        };
        if (shouldBePrimary) {
          publicUpdates.primaryPhotoPath = storagePath;
          publicUpdates.photoUrl = downloadUrl;
        }
        transaction.update(publicRef, publicUpdates);
      }
    });
  } catch (error) {
    try {
      await deleteObject(photoRef);
    } catch (cleanupError) {
      console.info("Fotografia încărcată nu a putut fi curățată:", cleanupError);
    }
    throw error;
  }

  return {
    photo: {
      id: photoId,
      storagePath,
      position: finalPosition,
      isPrimary: finalIsPrimary,
    },
    downloadUrl,
  };
}

export async function deleteProfilePhoto(
  uid: string,
  storagePath: string,
): Promise<void> {
  assertOwnedStoragePath(uid, storagePath);
  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);

  let newPrimaryPath: string | null = null;
  let wasPrimary = false;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const publicSnap = await transaction.get(publicRef);

    if (!userSnap.exists()) {
      throw new Error("PROFILE_NOT_FOUND");
    }
    const data = userSnap.data();
    const existingPaths: string[] = Array.isArray(data.photoPaths)
      ? data.photoPaths
      : [];

    if (!existingPaths.includes(storagePath)) {
      return;
    }

    const updatedPaths = existingPaths.filter((p) => p !== storagePath);
    wasPrimary = data.primaryPhotoPath === storagePath;
    newPrimaryPath = wasPrimary
      ? (updatedPaths[0] ?? null)
      : (data.primaryPhotoPath ?? null);

    const updates: Record<string, unknown> = {
      photoPaths: updatedPaths,
      primaryPhotoPath: newPrimaryPath ?? deleteField(),
      updatedAt: new Date().toISOString(),
    };

    if (wasPrimary && !newPrimaryPath) {
      updates.photoUrl = deleteField();
    }

    transaction.update(userRef, updates);

    if (publicSnap.exists()) {
      const publicUpdates: Record<string, unknown> = {
        photoPaths: updatedPaths,
        primaryPhotoPath: newPrimaryPath ?? deleteField(),
        updatedAt: new Date().toISOString(),
      };
      if (wasPrimary && !newPrimaryPath) {
        publicUpdates.photoUrl = deleteField();
      }
      transaction.update(publicRef, publicUpdates);
    }
  });

  const photoRef = ref(storage, storagePath);
  try {
    await deleteObject(photoRef);
  } catch (err) {
    console.info("Imaginea nu există în Storage sau a fost deja ștearsă:", err);
  }

  if (wasPrimary && newPrimaryPath) {
    try {
      const newPrimaryDownloadUrl = await getPhotoDownloadUrl(newPrimaryPath);
      await runTransaction(db, async (transaction) => {
        const publicSnap = await transaction.get(publicRef);

        transaction.update(userRef, { photoUrl: newPrimaryDownloadUrl });
        if (publicSnap.exists()) {
          transaction.update(publicRef, { photoUrl: newPrimaryDownloadUrl });
        }
      });
    } catch (e) {
      console.info("Nu s-a putut obține URL pentru noua poză primară:", e);
    }
  }
}

export async function replaceProfilePhoto(
  uid: string,
  targetStoragePath: string,
  newLocalUri: string,
  mimeType?: string | null,
): Promise<PhotoUploadResult> {
  assertOwnedStoragePath(uid, targetStoragePath);
  let response: Response;
  try {
    response = await fetch(newLocalUri);
    if (!response.ok) {
      throw new Error("PHOTO_READ_FAILED");
    }
  } catch (err) {
    throw new Error("PHOTO_READ_FAILED");
  }

  const photoBlob = await response.blob();
  const contentType = getValidContentType(mimeType, photoBlob.type);
  const newPhotoId = generatePhotoId();
  const newStoragePath = `profilePhotos/${uid}/${newPhotoId}.${getFileExtension(contentType)}`;
  const newPhotoRef = ref(storage, newStoragePath);

  await uploadBytes(newPhotoRef, photoBlob, {
    contentType,
  });
  const downloadUrl = await getDownloadURL(newPhotoRef);

  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);
  let finalPosition = 0;
  let isPrimary = false;

  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const publicSnap = await transaction.get(publicRef);

      if (!userSnap.exists()) {
        throw new Error("PROFILE_NOT_FOUND");
      }
      const data = userSnap.data();
      const existingPaths: string[] = Array.isArray(data.photoPaths)
        ? [...data.photoPaths]
        : [];

      const targetIndex = existingPaths.indexOf(targetStoragePath);
      if (targetIndex === -1) {
        existingPaths.push(newStoragePath);
        finalPosition = existingPaths.length - 1;
      } else {
        existingPaths[targetIndex] = newStoragePath;
        finalPosition = targetIndex;
      }

      const wasPrimary =
        data.primaryPhotoPath === targetStoragePath ||
        data.primaryPhotoPath === undefined;
      isPrimary = wasPrimary;

      const updates: Record<string, unknown> = {
        photoPaths: existingPaths,
        updatedAt: new Date().toISOString(),
      };

      if (wasPrimary) {
        updates.primaryPhotoPath = newStoragePath;
        updates.photoUrl = downloadUrl;
      }

      transaction.update(userRef, updates);

      if (publicSnap.exists()) {
        const publicUpdates: Record<string, unknown> = {
          photoPaths: existingPaths,
          updatedAt: new Date().toISOString(),
        };
        if (wasPrimary) {
          publicUpdates.primaryPhotoPath = newStoragePath;
          publicUpdates.photoUrl = downloadUrl;
        }
        transaction.update(publicRef, publicUpdates);
      }
    });
  } catch (error) {
    try {
      await deleteObject(newPhotoRef);
    } catch (cleanupError) {
      console.info("Fotografia nouă nu a putut fi curățată:", cleanupError);
    }
    throw error;
  }

  const oldPhotoRef = ref(storage, targetStoragePath);
  try {
    await deleteObject(oldPhotoRef);
  } catch (err) {
    console.info("Vechea imagine nu a putut fi ștearsă din Storage:", err);
  }

  return {
    photo: {
      id: newPhotoId,
      storagePath: newStoragePath,
      position: finalPosition,
      isPrimary,
    },
    downloadUrl,
  };
}
