import { COLORS } from "@/constants/colors";
import { ProfileImage } from "@/components/ProfileImage";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type FriendsCardProps = {
  username: string;
  photoUrl?: string;
  displayName?: string;
  isRemoving?: boolean;
  onOpenProfile: () => void;
  onRemove: () => void;
};

export function FriendsCard({
  username,
  photoUrl,
  displayName,
  isRemoving = false,
  onOpenProfile,
  onRemove,
}: FriendsCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenProfile}
        style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
      >
        <ProfileImage name={displayName || username} size={50} uri={photoUrl} />
        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.username}>@{username}</Text>
          <Text style={styles.hint}>Vezi profilul</Text>
        </View>
        <Ionicons color={COLORS.textSecondary} name="chevron-forward" size={20} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={isRemoving}
        onPress={onRemove}
        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
      >
        {isRemoving ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <>
            <Ionicons color={COLORS.primary} name="person-remove-outline" size={18} />
            <Text style={styles.removeText}>Elimină prietenul</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  details: { flex: 1, gap: 3 },
  username: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  hint: { color: COLORS.textSecondary, fontSize: 13 },
  removeButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
  },
  removeText: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.65 },
});
