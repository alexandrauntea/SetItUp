import { COLORS } from "@/constants/colors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
  accessibilityLabel?: string;
  testID?: string;
  fullScreen?: boolean;
};

export function LoadingState({
  message = "Se încarcă...",
  accessibilityLabel,
  testID,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityLiveRegion="polite"
      style={[styles.wrapper, fullScreen && styles.fullScreen]}
      testID={testID}
    >
      <View style={styles.card}>
        <View style={styles.indicatorContainer}>
          <ActivityIndicator
            accessibilityRole="progressbar"
            color={COLORS.primary}
            size="large"
          />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  indicatorContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
