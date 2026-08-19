import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  doc,
  runTransaction,
} from "firebase/firestore";
import { storage, db } from "./firebase";
import type { PhotoUploadResult } from "@/types/photo";

function generatePhotoId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getValidContentType(mimeType?: string | null, blobType?: string | null): string {
  if (mimeType && mimeType.trim() && mimeType.includes("/")) {
    return mimeType;
  }
  if (blobType && blobType.trim() && blobType.includes("/")) {
    return blobType;
  }
  return "image/jpeg";
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
  const photoId = generatePhotoId();
  const storagePath = `profilePhotos/${uid}/${photoId}.jpg`;
  const photoRef = ref(storage, storagePath);

  const contentType = getValidContentType(mimeType, photoBlob.type);

  await uploadBytes(photoRef, photoBlob, {
    contentType,
  });

  const downloadUrl = await getDownloadURL(photoRef);

  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);

  let finalPosition = 0;
  let finalIsPrimary = Boolean(isPrimary);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
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

    const publicSnap = await transaction.get(publicRef);
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
  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);

  const photoRef = ref(storage, storagePath);
  try {
    await deleteObject(photoRef);
  } catch (err) {
    console.info("Imaginea nu există în Storage sau a fost deja ștearsă:", err);
  }

  let newPrimaryPath: string | null = null;
  let wasPrimary = false;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
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
      primaryPhotoPath: newPrimaryPath,
      updatedAt: new Date().toISOString(),
    };

    if (wasPrimary && !newPrimaryPath) {
      updates.photoUrl = null;
    }

    transaction.update(userRef, updates);

    const publicSnap = await transaction.get(publicRef);
    if (publicSnap.exists()) {
      const publicUpdates: Record<string, unknown> = {
        photoPaths: updatedPaths,
        primaryPhotoPath: newPrimaryPath,
        updatedAt: new Date().toISOString(),
      };
      if (wasPrimary && !newPrimaryPath) {
        publicUpdates.photoUrl = null;
      }
      transaction.update(publicRef, publicUpdates);
    }
  });

  if (wasPrimary && newPrimaryPath) {
    try {
      const newPrimaryDownloadUrl = await getPhotoDownloadUrl(newPrimaryPath);
      await runTransaction(db, async (transaction) => {
        transaction.update(userRef, { photoUrl: newPrimaryDownloadUrl });
        const publicSnap = await transaction.get(publicRef);
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
  const newPhotoId = generatePhotoId();
  const newStoragePath = `profilePhotos/${uid}/${newPhotoId}.jpg`;
  const newPhotoRef = ref(storage, newStoragePath);

  const contentType = getValidContentType(mimeType, photoBlob.type);

  await uploadBytes(newPhotoRef, photoBlob, {
    contentType,
  });
  const downloadUrl = await getDownloadURL(newPhotoRef);

  const oldPhotoRef = ref(storage, targetStoragePath);
  try {
    await deleteObject(oldPhotoRef);
  } catch (err) {
    console.info("Vechea imagine nu a putut fi ștearsă din Storage:", err);
  }

  const userRef = doc(db, "users", uid);
  const publicRef = doc(db, "publicProfiles", uid);
  let finalPosition = 0;
  let isPrimary = false;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) {
      throw new Error("PROFILE_NOT_FOUND");
    }
    const data = userSnap.data();
    const existingPaths: string[] = Array.isArray(data.photoPaths)
      ? data.photoPaths
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

    const publicSnap = await transaction.get(publicRef);
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
