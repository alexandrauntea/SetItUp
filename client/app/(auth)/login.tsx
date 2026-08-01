import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { FormError } from "@/components/FormError";
import { COLORS } from "@/constants/colors";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const router = useRouter();

  function handleStart() {
    if (!email.trim() || !password) {
      setFormError("Completează emailul și parola.");
      return;
    }

    setFormError("");
    router.replace("/profile");
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

        <FormError message={formError} />

        <AppButton title="Login" onPress={handleStart} />

        <Link href="/register" style={styles.link}>
          Nu ai cont? Înregistrează-te
        </Link>
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
  link: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
