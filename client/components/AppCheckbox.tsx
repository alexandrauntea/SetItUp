import { COLORS } from "@/constants/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AppCheckboxProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function AppCheckbox({ label, value, onValueChange }: AppCheckboxProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => onValueChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.checkbox, value && styles.checkboxSelected]}>
        {value ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>

      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  label: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
