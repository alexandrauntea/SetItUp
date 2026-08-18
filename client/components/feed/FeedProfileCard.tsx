import type { FeedProfile } from "@/types/feed";
import { COLORS } from "@/constants/colors";
import { Image, StyleSheet, Text, View } from "react-native";

type FeedProfileCardProps = {
  profile: FeedProfile;
};

export function FeedProfileCard({ profile }: FeedProfileCardProps) {
  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <View style={styles.card}>
      {profile.photoUrl ? (
        <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Text style={styles.initial}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{displayName}, {profile.age}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {!!profile.occupation && (
          <Text style={styles.detail}>{profile.occupation}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.background,
  },
  photo: { width: "100%", aspectRatio: 1, backgroundColor: COLORS.surface },
  placeholder: { alignItems: "center", justifyContent: "center" },
  initial: { color: COLORS.primary, fontSize: 72, fontWeight: "800" },
  content: { gap: 4, padding: 20 },
  name: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  username: { color: COLORS.primary, fontWeight: "700" },
  detail: { color: COLORS.textSecondary, fontSize: 15 },
});
