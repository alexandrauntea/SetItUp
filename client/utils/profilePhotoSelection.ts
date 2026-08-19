import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type SelectedProfilePhoto = {
  uri: string;
  mimeType?: string | null;
};

export type ProfilePhotoSelectionResult =
  | { status: "selected"; photo: SelectedProfilePhoto }
  | { status: "cancelled" }
  | { status: "error"; title: string; message: string };

function normalizeMimeType(asset: ImagePicker.ImagePickerAsset) {
  const explicitMimeType = asset.mimeType?.toLowerCase().split(";")[0];

  if (explicitMimeType) {
    return explicitMimeType;
  }

  const extension = asset.fileName?.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";

  return undefined;
}

export async function selectProfilePhotoFromLibrary(): Promise<ProfilePhotoSelectionResult> {
  try {
    if (Platform.OS !== "web") {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return {
          status: "error",
          title: "Acces la fotografii",
          message:
            "Permite accesul la fotografii ca să poți alege o poză de profil.",
        };
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: false,
      exif: false,
    });

    if (result.canceled) {
      return { status: "cancelled" };
    }

    const asset = result.assets?.[0];

    if (!asset) {
      return {
        status: "error",
        title: "Fotografia nu a putut fi selectată",
        message: "Încearcă din nou și alege o fotografie din galerie.",
      };
    }

    if (asset.fileSize && asset.fileSize > MAX_PROFILE_PHOTO_SIZE) {
      return {
        status: "error",
        title: "Fotografia este prea mare",
        message: "Alege o fotografie mai mică de 5 MB.",
      };
    }

    const mimeType = normalizeMimeType(asset);

    if (mimeType && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return {
        status: "error",
        title: "Format neacceptat",
        message: "Alege o fotografie JPG, PNG sau WebP.",
      };
    }

    return {
      status: "selected",
      photo: {
        uri: asset.uri,
        mimeType,
      },
    };
  } catch (error) {
    console.info("Galeria nu a putut fi deschisă:", error);

    return {
      status: "error",
      title: "Galeria nu este disponibilă",
      message: "Nu am putut deschide galeria. Încearcă din nou.",
    };
  }
}
