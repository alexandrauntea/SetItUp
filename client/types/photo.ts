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
