import { AppButton } from "@/components/AppButton";
import { ProfileImage } from "@/components/ProfileImage";
import { COLORS } from "@/constants/colors";
import type { PublicProfile } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type MatchCardProps = {
  profile: PublicProfile | null;
  createdAt: string;
  opening?: boolean;
  onOpenProfile: () => void;
};

function formatMatchDate(createdAt: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

export function MatchCard({
  profile,
  createdAt,
  opening = false,
  onOpenProfile,
}: MatchCardProps) {
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Profil indisponibil";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ProfileImage name={fullName} size={60} uri={profile?.photoUrl} />

        <View style={styles.identity}>
          <Text style={styles.name}>{fullName}</Text>
          {profile ? (
            <Text style={styles.username}>@{profile.username}</Text>
          ) : (
            <Text style={styles.unavailableText}>
              Profilul public nu mai poate fi afișat.
            </Text>
          )}
        </View>

        <View style={styles.heartIcon}>
          <Ionicons color={COLORS.primary} name="heart" size={22} />
        </View>
      </View>

      <Text style={styles.matchDate}>
        Potrivire din {formatMatchDate(createdAt)}
      </Text>

      <AppButton
        disabled={!profile}
        loading={opening}
        onPress={onOpenProfile}
        title="Vezi profilul"
        variant="outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identity: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  username: { color: COLORS.textSecondary, fontSize: 14 },
  unavailableText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  heartIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
  },
  matchDate: { color: COLORS.textSecondary, fontSize: 13 },
});
