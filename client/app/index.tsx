import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { COLORS } from "@/constants/colors";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleStart() {
    Alert.alert("Date introduse", `Email: ${email}`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>SetItUp</Text>
        <Text style={styles.subtitle}>Autentifică-te în cont</Text>

        <AppInput
          label="Email"
          placeholder="nume@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label="Parolă"
          placeholder="Introdu parola"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <AppButton title="Login" onPress={handleStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});
