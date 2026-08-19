import { uploadProfilePhoto as uploadPhotoStorage } from "./photoStorageService";

export async function uploadProfilePhoto(
  uid: string,
  localUri: string,
  mimeType?: string | null,
): Promise<string> {
  const result = await uploadPhotoStorage(uid, localUri, mimeType, true);
  return result.downloadUrl;
}
