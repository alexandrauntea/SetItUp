import { AppButton } from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  function handleStart() {
    Alert.alert("SetItUp", "Butonul funcționează!");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SetItUp</Text>
      <Text style={styles.subtitle}>Fresh start</Text>

      <AppButton title="Începe" onPress={handleStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
