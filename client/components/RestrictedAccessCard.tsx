import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type RestrictedAccessCardProps = {
  testID?: string;
};

export function RestrictedAccessCard({ testID }: RestrictedAccessCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.iconContainer}>
        <Ionicons
          color={COLORS.primary}
          name="shield-outline"
          size={48}
        />
      </View>
      <Text style={styles.title}>Acces restricționat</Text>
      <Text style={styles.description}>Disponibil managerilor desemnați.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    gap: 14,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
