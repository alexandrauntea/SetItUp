import { COLORS } from "@/constants/colors";
import { ProfileImage } from "@/components/ProfileImage";
import { FeedItem } from "@/types/feed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface FeedCardProps {
  item: FeedItem;
  onLike: () => void;
  onDislike: () => void;
  loadingAction?: "like" | "dislike" | null;
}

export function FeedCard({
  item,
  onLike,
  onDislike,
  loadingAction,
}: FeedCardProps) {
  const { profile } = item;
  const isLiking = loadingAction === "like";
  const isDisliking = loadingAction === "dislike";
  const isActionBusy = isLiking || isDisliking;

  return (
    <View style={styles.card}>
      {/* Profile Image / Fallback Avatar */}
      <View style={styles.imageContainer}>
        <ProfileImage
          borderRadius={0}
          name={`${profile.firstName} ${profile.lastName}`}
          size="fill"
          uri={profile.photoUrl}
        />

      </View>

      {/* Profile Info */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.nameText}>
            {profile.firstName} {profile.lastName}, {profile.age}
          </Text>
          <Text style={styles.usernameText}>@{profile.username}</Text>
        </View>

        {profile.occupation ? (
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.occupationText}>{profile.occupation}</Text>
          </View>
        ) : null}

        {profile.description ? (
          <Text style={styles.descriptionText}>{profile.description}</Text>
        ) : null}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest: string, idx: number) => (
              <View key={`${interest}-${idx}`} style={styles.interestTag}>
                <Text style={styles.interestTagText}>#{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityLabel="Nu îmi place"
          accessibilityRole="button"
          disabled={isActionBusy}
          onPress={onDislike}
          style={({ pressed }) => [
            styles.actionButton,
            styles.dislikeButton,
            pressed && styles.buttonPressed,
          ]}
          testID="dislike-button"
        >
          {isDisliking ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Ionicons name="close" size={32} color={COLORS.error} />
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Îmi place"
          accessibilityRole="button"
          disabled={isActionBusy}
          onPress={onLike}
          style={({ pressed }) => [
            styles.actionButton,
            styles.likeButton,
            pressed && styles.buttonPressed,
          ]}
          testID="like-button"
        >
          {isLiking ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Ionicons name="heart" size={32} color={COLORS.background} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    width: "100%",
    height: 320,
    backgroundColor: COLORS.surface,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 20,
    gap: 10,
  },
  headerRow: {
    gap: 2,
  },
  nameText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  usernameText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occupationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  descriptionText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  interestTag: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestTagText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  dislikeButton: {
    backgroundColor: COLORS.errorBackground,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  likeButton: {
    backgroundColor: COLORS.primary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
