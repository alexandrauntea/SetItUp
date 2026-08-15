import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type FeedEmptyStateProps = {
  message?: string;
};

export function FeedEmptyState({
  message = "Nu mai sunt profiluri disponibile momentan.",
}: FeedEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons color={COLORS.primary} name="people-outline" size={42} />
      <Text style={styles.title}>Ai ajuns la final</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  title: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  message: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 21 },
});
