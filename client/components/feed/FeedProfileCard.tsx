import type { FeedProfile } from "@/types/feed";
import { COLORS } from "@/constants/colors";
import { ProfileImage } from "@/components/ProfileImage";
import { StyleSheet, Text, View } from "react-native";

type FeedProfileCardProps = {
  profile: FeedProfile;
};

export function FeedProfileCard({ profile }: FeedProfileCardProps) {
  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <ProfileImage
          borderRadius={0}
          name={displayName}
          size="fill"
          uri={profile.photoUrl}
        />
      </View>
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
  content: { gap: 4, padding: 20 },
  name: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  username: { color: COLORS.primary, fontWeight: "700" },
  detail: { color: COLORS.textSecondary, fontSize: 15 },
});
