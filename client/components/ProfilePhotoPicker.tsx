import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export type SelectedProfilePhoto = {
  uri: string;
  mimeType?: string | null;
};

type ProfilePhotoPickerProps = {
  initials: string;
  photoUri?: string | null;
  onPhotoSelected: (photo: SelectedProfilePhoto) => void;
  disabled?: boolean;
};

export function ProfilePhotoPicker({
  initials,
  photoUri,
  onPhotoSelected,
  disabled = false,
}: ProfilePhotoPickerProps) {
  async function handleChoosePhoto() {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Acces la fotografii",
          "Permite accesul la fotografii ca să poți alege o poză de profil.",
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled) return;

    const photo = result.assets[0];

    if (photo.fileSize && photo.fileSize > MAX_PHOTO_SIZE) {
      Alert.alert(
        "Fotografia este prea mare",
        "Alege o fotografie mai mică de 5 MB.",
      );
      return;
    }

    onPhotoSelected({
      uri: photo.uri,
      mimeType: photo.mimeType,
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={photoUri ? "Schimbă poza de profil" : "Alege poza de profil"}
      disabled={disabled}
      onPress={() => void handleChoosePhoto()}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
        disabled && styles.containerDisabled,
      ]}
    >
      <View style={styles.avatar}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} contentFit="cover" style={styles.image} />
        ) : (
          <Text style={styles.initials}>{initials || "?"}</Text>
        )}

        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={17} color={COLORS.background} />
        </View>
      </View>

      <Text style={styles.actionText}>
        {photoUri ? "Schimbă poza" : "Alege o poză"}
      </Text>
      <Text style={styles.helperText}>JPG sau PNG, maximum 5 MB</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    gap: 5,
  },
  containerPressed: {
    opacity: 0.75,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 3,
    borderColor: COLORS.background,
    borderRadius: 52,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 52,
  },
  initials: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "700",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
    borderRadius: 17,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
