import { COLORS } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

type FormErrorProps = {
  message?: string;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 12,
    backgroundColor: COLORS.errorBackground,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  text: {
    color: COLORS.error,
    fontSize: 14,
  },
});
