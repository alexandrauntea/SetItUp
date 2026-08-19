export const MAX_PROFILE_PHOTOS = 6;

export interface ProfilePhoto {
  id: string;
  storagePath: string;
  position: number;
  isPrimary: boolean;
}

export interface PhotoUploadResult {
  photo: ProfilePhoto;
  downloadUrl: string;
}
