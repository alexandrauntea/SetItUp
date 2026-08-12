import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import type { FriendRequest } from "../../types/social";

type FriendRequestAction = "accept" | "decline" | "cancel";

type CommonProps = {
  request: FriendRequest;
  processingAction?: FriendRequestAction | null;
};

type IncomingProps = CommonProps & {
  direction: "incoming";
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

type OutgoingProps = CommonProps & {
  direction: "outgoing";
  onCancel: (requestId: string) => void;
};

export type FriendRequestCardProps = IncomingProps | OutgoingProps;

type ActionButtonProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  variant?: "primary" | "outline" | "danger";
};

function formatRequestDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ActionButton({
  title,
  icon,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "outline" && styles.outlineButton,
        variant === "danger" && styles.dangerButton,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? COLORS.background : COLORS.primary}
          size="small"
        />
      ) : (
        <>
          <Ionicons
            color={variant === "primary" ? COLORS.background : COLORS.primary}
            name={icon}
            size={17}
          />
          <Text
            style={[
              styles.actionButtonText,
              variant !== "primary" && styles.outlineButtonText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function FriendRequestCard(props: FriendRequestCardProps) {
  const { direction, processingAction, request } = props;
  const username =
    direction === "incoming"
      ? request.senderUsername
      : request.receiverUsername;
  const initials = username.slice(0, 2).toUpperCase();
  const formattedDate = formatRequestDate(request.createdAt);
  const isProcessing = processingAction != null;

  return (
    <View style={styles.card}>
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "?"}</Text>
        </View>

        <View style={styles.userDetails}>
          <Text numberOfLines={1} style={styles.username}>
            @{username}
          </Text>
          <Text style={styles.directionLabel}>
            {direction === "incoming"
              ? "Ți-a trimis o cerere de prietenie"
              : "Cerere de prietenie trimisă"}
          </Text>
          {formattedDate ? (
            <Text style={styles.date}>{formattedDate}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {direction === "incoming" ? (
          <>
            <ActionButton
              disabled={isProcessing}
              icon="checkmark-outline"
              loading={processingAction === "accept"}
              onPress={() => props.onAccept(request.id)}
              title="Acceptă"
            />
            <ActionButton
              disabled={isProcessing}
              icon="close-outline"
              loading={processingAction === "decline"}
              onPress={() => props.onDecline(request.id)}
              title="Refuză"
              variant="outline"
            />
          </>
        ) : (
          <ActionButton
            disabled={isProcessing}
            icon="trash-outline"
            loading={processingAction === "cancel"}
            onPress={() => props.onCancel(request.id)}
            title="Anulează cererea"
            variant="danger"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 26,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  userDetails: {
    flex: 1,
    gap: 3,
  },
  username: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  directionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    minHeight: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  outlineButton: {
    backgroundColor: COLORS.background,
  },
  dangerButton: {
    backgroundColor: COLORS.background,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "700",
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
});
