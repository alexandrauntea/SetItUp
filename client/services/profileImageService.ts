import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "./firebase";

export async function uploadProfilePhoto(
  uid: string,
  localUri: string,
  mimeType?: string | null,
): Promise<string> {
  const response = await fetch(localUri);

  if (!response.ok) {
    throw new Error("PHOTO_READ_FAILED");
  }

  const photoBlob = await response.blob();
  const photoReference = ref(storage, `profile-images/${uid}/avatar`);

  await uploadBytes(photoReference, photoBlob, {
    contentType: mimeType ?? photoBlob.type ?? "image/jpeg",
  });

  return getDownloadURL(photoReference);
}
