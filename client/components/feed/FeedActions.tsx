import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type FeedActionsProps = {
  disabled?: boolean;
  submittingValue?: "like" | "dislike" | null;
  onLike: () => void;
  onDislike: () => void;
};

export function FeedActions({
  disabled = false,
  submittingValue = null,
  onLike,
  onDislike,
}: FeedActionsProps) {
  return (
    <View style={styles.container}>
      <Action
        accessibilityLabel="Nu îmi place"
        color={COLORS.textSecondary}
        disabled={disabled || submittingValue !== null}
        icon="close"
        loading={submittingValue === "dislike"}
        onPress={onDislike}
      />
      <Action
        accessibilityLabel="Îmi place"
        color={COLORS.primary}
        disabled={disabled || submittingValue !== null}
        icon="heart"
        loading={submittingValue === "like"}
        onPress={onLike}
      />
    </View>
  );
}

type ActionProps = {
  accessibilityLabel: string;
  color: string;
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  loading: boolean;
  onPress: () => void;
};

function Action({
  accessibilityLabel,
  color,
  disabled,
  icon,
  loading,
  onPress,
}: ActionProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { borderColor: color },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons color={color} name={icon} size={30} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "center", gap: 24 },
  action: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 32,
    backgroundColor: COLORS.background,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.5 },
});
