import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PageBannerProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
};

export function PageBanner({ title, subtitle, onBack, action }: PageBannerProps) {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryPressed]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      {onBack ? (
        <Pressable
          accessibilityLabel="Înapoi"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        >
          <Ionicons color={COLORS.primary} name="arrow-back" size={23} />
        </Pressable>
      ) : null}

      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {action ? <View style={styles.action}>{action}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    maxWidth: 430,
    minHeight: 104,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primaryPressed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  textContainer: { flex: 1, gap: 4 },
  title: { color: COLORS.background, fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "rgba(255,255,255,0.86)", fontSize: 14, fontWeight: "600" },
  roundButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.background,
  },
  pressed: { opacity: 0.7 },
  action: { alignItems: "center", justifyContent: "center" },
});
