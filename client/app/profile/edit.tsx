import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { FormError } from "@/components/FormError";
import { InterestSelector } from "@/components/InterestSelector";
import {
  ProfilePhotoPicker,
  type SelectedProfilePhoto,
} from "@/components/ProfilePhotoPicker";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { GENDER_OPTIONS } from "@/constants/profileOptions";
import { useRouter } from "expo-router";
import { uploadProfilePhoto } from "@/services/profileImageService";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [occupation, setOccupation] = useState(profile?.occupation ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "other");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [isPrivate, setIsPrivate] = useState(profile?.isPrivate ?? false);
  const [selectedPhoto, setSelectedPhoto] =
    useState<SelectedProfilePhoto | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((currentInterests) => {
      if (currentInterests.includes(interest)) {
        return currentInterests.filter((item) => item !== interest);
      }

      return [...currentInterests, interest];
    });
  }

  async function handleSave() {
    if (!firstName.trim()) {
      setFormError("Scrie prenumele tău.");
      return;
    }

    if (!lastName.trim()) {
      setFormError("Scrie numele de familie.");
      return;
    }

    if (!occupation.trim()) {
      setFormError("Adaugă ocupația ta.");
      return;
    }

    if (!description.trim()) {
      setFormError("Scrie câteva rânduri despre tine.");
      return;
    }

    if (!gender) {
      setFormError("Selectează genul.");
      return;
    }

    if (interests.length === 0) {
      setFormError("Selectează cel puțin un interes.");
      return;
    }

    setFormError("");

    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("AUTH_REQUIRED");
      }

      const photoUrl = selectedPhoto
        ? await uploadProfilePhoto(
            user.uid,
            selectedPhoto.uri,
            selectedPhoto.mimeType,
          )
        : profile?.photoUrl;

      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        description: description.trim(),
        occupation: occupation.trim(),
        gender,
        interests,
        isPrivate,
        ...(photoUrl ? { photoUrl } : {}),
      });

      Alert.alert("SetItUp", "Profilul a fost actualizat.", [
        {
          text: "OK",
          onPress: () => router.replace("/profile/view"),
        },
      ]);
    } catch (error) {
      console.error("Profilul nu a putut fi actualizat:", error);
      setFormError(
        getFirebaseErrorMessage(
          error,
          "Fotografia sau modificările nu au putut fi salvate.",
        ),
      );
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
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.heading}>
                <Text style={styles.title}>Editează profilul</Text>
              </View>

              <View style={styles.form}>
                <ProfilePhotoPicker
                  initials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
                  photoUri={selectedPhoto?.uri ?? profile?.photoUrl}
                  onPhotoSelected={setSelectedPhoto}
                  disabled={isSubmitting}
                />

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

                <View style={styles.optionSection}>
                  <Text style={styles.label}>Gen</Text>

                  <View style={styles.optionsRow}>
                    {GENDER_OPTIONS.map((option) => {
                      const isSelected = gender === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setGender(option.value)}
                          style={[
                            styles.genderOption,
                            isSelected && styles.optionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                <AppInput
                  label="Descriere"
                  placeholder="Ce ai vrea să știe ceilalți despre tine?"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={250}
                  style={styles.descriptionInput}
                />

                <InterestSelector
                  selectedInterests={interests}
                  onToggleInterest={toggleInterest}
                  disabled={isSubmitting}
                />

                <View style={styles.divider} />

                <View style={styles.visibilitySection}>
                  <Text style={styles.sectionTitle}>Cine îți vede profilul?</Text>

                  <View style={styles.visibilityOptions}>
                    <Pressable
                      onPress={() => setIsPrivate(false)}
                      style={[
                        styles.visibilityOption,
                        !isPrivate && styles.optionSelected,
                      ]}
                    >
                      <View style={styles.visibilityTextContainer}>
                        <Text style={styles.visibilityTitle}>Public</Text>
                        <Text style={styles.visibilityDescription}>
                          Profilul poate fi descoperit de ceilalți utilizatori.
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
                        isPrivate && styles.optionSelected,
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
                </View>

                <FormError message={formError} />

                <AppButton
                  title="Salvează"
                  onPress={handleSave}
                  loading={isSubmitting}
                />
                <AppButton
                  title="Anulează"
                  variant="outline"
                  onPress={() => router.replace("/profile/view")}
                />
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
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
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
  heading: {
    gap: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
  },
  form: {
    gap: 22,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  optionSection: {
    gap: 10,
  },
  optionsRow: {
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
  interestOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 999,
  },
  optionSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  descriptionInput: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
  },
  visibilitySection: {
    gap: 14,
  },
  visibilityOptions: {
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
