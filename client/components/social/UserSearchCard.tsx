import { AppButton } from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import type { RelationshipState, UserSearchResult } from "@/types/social";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type UserSearchCardProps = {
  result: UserSearchResult;
  isSending: boolean;
  onSendRequest: () => void;
  onOpenProfile: () => void;
};

const relationshipLabels: Record<Exclude<RelationshipState, "none">, string> = {
  "request-sent": "Cerere trimisă",
  "request-received": "Ți-a trimis o cerere",
  friends: "Sunteți prieteni",
};

export function UserSearchCard({
  result,
  isSending,
  onSendRequest,
  onOpenProfile,
}: UserSearchCardProps) {
  const fullName = result.profile
    ? `${result.profile.firstName} ${result.profile.lastName}`.trim()
    : `@${result.username}`;
  const initials = result.profile
    ? `${result.profile.firstName.charAt(0)}${result.profile.lastName.charAt(0)}`
    : result.username.slice(0, 2);

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {result.profile?.photoUrl ? (
          <Image
            source={{ uri: result.profile.photoUrl }}
            contentFit="cover"
            style={styles.photo}
          />
        ) : (
          <Text style={styles.initials}>{initials.toUpperCase()}</Text>
        )}
      </View>

      <View style={styles.identity}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.username}>
          {result.profile ? `@${result.username}` : "Profil privat"}
        </Text>
      </View>

      {result.profile ? (
        <AppButton
          title="Vezi profilul"
          variant="outline"
          onPress={onOpenProfile}
        />
      ) : null}

      {result.relationshipState === "none" ? (
        <AppButton
          title="Trimite cerere"
          onPress={onSendRequest}
          loading={isSending}
        />
      ) : (
        <View style={styles.relationshipBadge}>
          <Text style={styles.relationshipText}>
            {relationshipLabels[result.relationshipState]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 34,
    backgroundColor: COLORS.primarySoft,
  },
  photo: { width: "100%", height: "100%" },
  initials: { color: COLORS.primary, fontSize: 22, fontWeight: "800" },
  identity: { alignItems: "center", gap: 3 },
  name: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  username: { color: COLORS.textSecondary, fontSize: 15 },
  relationshipBadge: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  relationshipText: {
    color: COLORS.primary,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
});
