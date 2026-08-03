import { AppButton } from "@/components/AppButton";
import { AppCheckbox } from "@/components/AppCheckbox";
import { AppInput } from "@/components/AppInput";
import { FormError } from "@/components/FormError";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { createUserProfile } from "@/services/profileService";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import {
  formatBirthDateInput,
  validateBirthDate,
  validateUsername,
} from "@/utils/validation";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecoverProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRecoverProfile() {
    if (!validateUsername(username)) {
      setFormError(
        "Username-ul trebuie să aibă între 3 și 20 de caractere și poate conține litere, cifre și underscore (_).",
      );
      return;
    }

    if (!validateBirthDate(birthDate)) {
      setFormError(
        "Introdu data în formatul ZZ/LL/AAAA. Trebuie să ai cel puțin 18 ani.",
      );
      return;
    }

    if (!gdprAccepted) {
      setFormError("Trebuie să accepți termenii și politica GDPR.");
      return;
    }

    if (!user?.email) {
      setFormError("Contul nu are o adresă de email validă.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await createUserProfile({
        uid: user.uid,
        username,
        email: user.email,
        birthDate,
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
      console.error("Profilul nu a putut fi recuperat:", error);

      if (error instanceof Error && error.message === "USERNAME_TAKEN") {
        setFormError("Numele de utilizator este deja folosit.");
      } else {
        setFormError(
          getFirebaseErrorMessage(
            error,
            "Profilul nu a putut fi creat. Încearcă din nou.",
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
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Completează profilul</Text>
              <Text style={styles.description}>
                Contul tău există, dar îi lipsesc câteva informații.
              </Text>

              <AppInput
                label="Nume de utilizator"
                placeholder="De exemplu: andrei21"
                value={username}
                onChangeText={setUsername}
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

              <AppCheckbox
                label="Sunt de acord cu termenii și politica GDPR."
                value={gdprAccepted}
                onValueChange={setGdprAccepted}
              />

              <FormError message={formError} />

              <AppButton
                title="Continuă"
                onPress={handleRecoverProfile}
                loading={isSubmitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 18,
    padding: 24,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "700",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
});
