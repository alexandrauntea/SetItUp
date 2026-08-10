import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandLogo } from "@/components/BrandLogo";
import { FormError } from "@/components/FormError";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { loginUser } from "@/services/authService";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import {
  getFirstValidationError,
  validateLoginForm,
} from "@/utils/validation";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStart() {
    const validation = validateLoginForm({ email, password });

    if (!validation.isValid) {
      setFormError(getFirstValidationError(validation.errors));
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await loginUser(email.trim(), password);
    } catch (error) {
      console.error("Autentificarea a eșuat:", error);
      setFormError(
        getFirebaseErrorMessage(
          error,
          "Contul nu a putut fi autentificat. Încearcă din nou.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <BrandLogo />

          <Text style={styles.title}>Bine ai revenit</Text>

          <AppInput
            label="Email"
            placeholder="adresa@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label="Parolă"
            placeholder="Parola ta"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <FormError message={formError} />

          <AppButton
            title="Intră în cont"
            onPress={handleStart}
            loading={isSubmitting}
          />

          <Link href="/register" style={styles.link}>
            Nu ai cont? Creează unul
          </Link>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 16,
    padding: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 24,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  link: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
