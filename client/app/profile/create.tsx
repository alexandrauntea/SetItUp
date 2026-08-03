import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { FormError } from "@/components/FormError";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useProfile } from "@/contexts/ProfileContext";
import { GENDER_OPTIONS, INTEREST_OPTIONS } from "@/constants/profileOptions";
import type { Gender } from "@/types/profile";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateProfileScreen() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [description, setDescription] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");

  function toggleInterest(interest: string) {
    setInterests((currentInterests) => {
      const isSelected = currentInterests.includes(interest);

      if (isSelected) {
        return currentInterests.filter((item) => item !== interest);
      }

      return [...currentInterests, interest];
    });
  }

  function handleContinue() {
    if (step === 1) {
      const missingFields: string[] = [];

      if (!firstName.trim()) missingFields.push("Prenume");
      if (!lastName.trim()) missingFields.push("Nume de familie");
      if (!occupation.trim()) missingFields.push("Ocupație");
      if (!gender) missingFields.push("Gen");

      if (missingFields.length > 0) {
        setFormError(
          missingFields.length === 1
            ? `Completează câmpul „${missingFields[0]}”.`
            : "Completează câmpurile lipsă.",
        );
        return;
      }

      setFormError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!description.trim()) {
        setFormError("Completeaza descrierea.");
        return;
      }

      if (interests.length === 0) {
        setFormError("Selectează cel puțin un interes.");
        return;
      }

      setFormError("");
      setStep(3);
      return;
    }

    if (!gender) {
      setFormError("Selectează genul.");
      setStep(1);
      return;
    }

    setFormError("");

    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      occupation,
      gender,
      description,
      interests,
      isPrivate,
    });

    Alert.alert("Gata!", "Profilul tău este pregătit.", [
      {
        text: "Continuă",
        onPress: () => router.replace("/profile/view"),
      },
    ]);
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
              <View style={styles.progressHeader}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressValue,
                      {
                        width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.heading}>
                <Text style={styles.title}>
                  {step === 1
                    ? "Cum te prezinți?"
                    : step === 2
                      ? "Ce te definește?"
                      : "Cine îți vede profilul?"}
                </Text>
              </View>

              <View style={styles.form}>
                {step === 1 ? (
                  <>
                    <AppInput
                      label="Prenume"
                      placeholder="De exemplu: Andrei"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />

                    <AppInput
                      label="Nume de familie"
                      placeholder="De exemplu: Barbuceanu"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />

                    <AppInput
                      label="Ocupație"
                      placeholder="De exemplu: student"
                      value={occupation}
                      onChangeText={setOccupation}
                      autoCapitalize="sentences"
                    />

                    <View style={styles.genderSection}>
                      <Text style={styles.label}>Gen</Text>

                      <View style={styles.genderOptions}>
                        {GENDER_OPTIONS.map((option) => {
                          const isSelected = gender === option.value;

                          return (
                            <Pressable
                              key={option.value}
                              onPress={() => setGender(option.value)}
                              style={[
                                styles.genderOption,
                                isSelected && styles.genderOptionSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.genderText,
                                  isSelected && styles.genderTextSelected,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </>
                ) : step === 2 ? (
                  <>
                    <AppInput
                      label="Descriere"
                      placeholder="Scrie câteva cuvinte"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      maxLength={250}
                      style={styles.descriptionInput}
                    />

                    <View style={styles.interestsSection}>
                      <Text style={styles.label}>Interese</Text>

                      <View style={styles.interestOptions}>
                        {INTEREST_OPTIONS.map((interest) => {
                          const isSelected = interests.includes(interest);

                          return (
                            <Pressable
                              key={interest}
                              onPress={() => toggleInterest(interest)}
                              style={[
                                styles.interestOption,
                                isSelected && styles.interestOptionSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.interestText,
                                  isSelected && styles.interestTextSelected,
                                ]}
                              >
                                {interest}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.visibilitySection}>
                      <Pressable
                        onPress={() => setIsPrivate(false)}
                        style={[
                          styles.visibilityOption,
                          !isPrivate && styles.visibilityOptionSelected,
                        ]}
                      >
                        <View style={styles.visibilityTextContainer}>
                          <Text style={styles.visibilityTitle}>Public</Text>
                          <Text style={styles.visibilityDescription}>
                            Profilul poate fi descoperit de ceilalți
                            utilizatori.
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            !isPrivate && styles.radioSelected,
                          ]}
                        >
                          {!isPrivate ? <View style={styles.radioDot} /> : null}
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={() => setIsPrivate(true)}
                        style={[
                          styles.visibilityOption,
                          isPrivate && styles.visibilityOptionSelected,
                        ]}
                      >
                        <View style={styles.visibilityTextContainer}>
                          <Text style={styles.visibilityTitle}>Privat</Text>
                          <Text style={styles.visibilityDescription}>
                            Nimeni nu îți poate vedea profilul.
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            isPrivate && styles.radioSelected,
                          ]}
                        >
                          {isPrivate ? <View style={styles.radioDot} /> : null}
                        </View>
                      </Pressable>
                    </View>
                  </>
                )}

                <FormError message={formError} />

                <AppButton
                  title={step === 3 ? "Creează profilul" : "Continuă"}
                  onPress={handleContinue}
                />

                {step > 1 ? (
                  <AppButton
                    title="Înapoi"
                    variant="outline"
                    onPress={() => {
                      setFormError("");
                      setStep((currentStep) => currentStep - 1);
                    }}
                  />
                ) : null}
              </View>
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
    padding: 24,
    gap: 28,
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
  progressHeader: {
    gap: 10,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
  },
  progressValue: {
    width: "33%",
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  heading: {
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "bold",
  },
  form: {
    gap: 18,
  },
  genderSection: {
    gap: 8,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  genderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genderOption: {
    flexGrow: 1,
    minWidth: 90,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 14,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  genderText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  genderTextSelected: {
    color: COLORS.primary,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  interestsSection: {
    gap: 8,
  },
  interestOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 999,
  },
  interestOptionSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  interestText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  interestTextSelected: {
    color: COLORS.primary,
  },
  visibilitySection: {
    gap: 12,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 16,
  },
  visibilityOptionSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  visibilityTextContainer: {
    flex: 1,
    gap: 4,
  },
  visibilityTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  visibilityDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
});
