import { COLORS } from "@/constants/colors";
import { FeedCandidateProfile } from "@/types/feed";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface MatchModalProps {
  visible: boolean;
  matchedProfile?: FeedCandidateProfile;
  ownerUsername?: string;
  onClose: () => void;
}

export function MatchModal({
  visible,
  matchedProfile,
  ownerUsername,
  onClose,
}: MatchModalProps) {
  if (!matchedProfile) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container} testID="match-modal-container">
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={48} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Este match!</Text>

          <Text style={styles.description}>
            {ownerUsername
              ? `Ai găsit o potrivire potrivită pentru @${ownerUsername}!`
              : "Ați creat o potrivire reciprocă!"}
          </Text>

          {/* Matched Profile Summary */}
          <View style={styles.profileBox}>
            {matchedProfile.photoUrl ? (
              <Image
                source={{ uri: matchedProfile.photoUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons name="person" size={36} color={COLORS.primary} />
              </View>
            )}

            <View style={styles.profileTextContainer}>
              <Text style={styles.profileName}>
                {matchedProfile.firstName} {matchedProfile.lastName}
              </Text>
              <Text style={styles.profileUsername}>
                @{matchedProfile.username}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Continuă"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.buttonPressed,
            ]}
            testID="match-close-button"
          >
            <Text style={styles.closeButtonText}>Continuă</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.background,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 16,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 18,
    width: "100%",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  profileUsername: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});