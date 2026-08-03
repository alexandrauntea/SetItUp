import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandLogo } from "@/components/BrandLogo";
import { FormError } from "@/components/FormError";
import { ScreenBackground } from "@/components/ScreenBackground";
import { AppCheckbox } from "@/components/AppCheckbox";
import { COLORS } from "@/constants/colors";
import { useProfile } from "@/contexts/ProfileContext";
import { logoutUser, registerUser } from "@/services/authService";
import { createUserProfile } from "@/services/profileService";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import {
  formatBirthDateInput,
  getFirstValidationError,
  validateRegisterForm,
} from "@/utils/validation";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    const validation = validateRegisterForm({
      username,
      email,
      birthDate,
      password,
      confirmPassword,
      gdprConsent: gdprAccepted,
    });

    if (!validation.isValid) {
      setFormError(getFirstValidationError(validation.errors));
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    let accountWasCreated = false;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await registerUser(normalizedEmail, password);
      accountWasCreated = true;

      await createUserProfile({
        uid: user.uid,
        username: username.trim(),
        email: normalizedEmail,
        birthDate: birthDate.trim(),
        firstName: "",
        lastName: "",
        occupation: "",
        gender: "other",
        description: "",
        interests: [],
        isPrivate: false,
        gdprAcceptedAt: new Date().toISOString(),
        profileCompleted: false,
      });

      await refreshProfile(user.uid);
      router.replace("/profile/create");
    } catch (error) {
      console.error("Înregistrarea a eșuat:", error);

      if (accountWasCreated) {
        try {
          await logoutUser();
        } catch (logoutError) {
          console.error("Contul nou nu a putut fi deconectat:", logoutError);
        }
      }

      if (error instanceof Error && error.message === "USERNAME_TAKEN") {
        setFormError("Numele de utilizator este deja folosit.");
      } else {
        setFormError(
          getFirebaseErrorMessage(
            error,
            "Contul nu a putut fi creat. Încearcă din nou.",
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <BrandLogo size={56} />

            <Text style={styles.title}>Creează-ți contul</Text>

            <AppInput
              label="Nume de utilizator"
              placeholder="De exemplu: andrei21"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <AppInput
              label="Email"
              placeholder="adresa@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppInput
              label="Data nașterii"
              placeholder="ZZ/LL/AAAA"
              value={birthDate}
              onChangeText={(value) =>
                setBirthDate(formatBirthDateInput(value))
              }
              keyboardType="number-pad"
              maxLength={10}
            />

            <AppInput
              label="Parolă"
              placeholder="Alege o parolă"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <AppInput
              label="Confirmă parola"
              placeholder="Confirmă parola"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <AppCheckbox
              label="Sunt de acord cu termenii și politica GDPR."
              value={gdprAccepted}
              onValueChange={setGdprAccepted}
            />

            <FormError message={formError} />

            <AppButton
              title="Creează contul"
              onPress={handleRegister}
              loading={isSubmitting}
            />

            <Link href="/login" style={styles.link}>
              Ai deja cont? Intră în cont
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 40,
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
    fontSize: 30,
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
