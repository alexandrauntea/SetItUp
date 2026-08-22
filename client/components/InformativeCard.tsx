import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type InformativeCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  children?: ReactNode;
  testID?: string;
};

export function InformativeCard({ icon, message, children, testID }: InformativeCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <Ionicons color={COLORS.primary} name={icon} size={36} />
      <Text style={styles.message}>{message}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  message: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: "center",
  },
});
