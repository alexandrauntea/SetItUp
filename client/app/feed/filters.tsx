import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import {
  FeedPreferences,
  preferencesService,
  validatePreferences,
} from "../../services/preferencesService";

export default function FeedFiltersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [minAge, setMinAge] = useState<string>("18");
  const [maxAge, setMaxAge] = useState<string>("50");
  const [genderPreference, setGenderPreference] = useState<
    "male" | "female" | "everyone"
  >("everyone");
  const [interestsText, setInterestsText] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMessage(null);
        const prefs = await preferencesService.getOwnerPreferences(user.uid);
        if (isMounted) {
          setMinAge(prefs.minAge.toString());
          setMaxAge(prefs.maxAge.toString());
          setGenderPreference(prefs.genderPreference);
          setInterestsText(prefs.interests.join(", "));
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(
            err.message || "Eroare la încărcarea preferințelor."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) {
      setErrorMessage("Utilizatorul nu este autentificat.");
      return;
    }

    const parsedMinAge = parseInt(minAge, 10);
    const parsedMaxAge = parseInt(maxAge, 10);
    const parsedInterests = interestsText
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const preferencesData: FeedPreferences = {
      minAge: parsedMinAge,
      maxAge: parsedMaxAge,
      genderPreference,
      interests: parsedInterests,
    };

    const validationError = validatePreferences(preferencesData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await preferencesService.saveOwnerPreferences(
        user.uid,
        preferencesData
      );
      setSuccessMessage("Preferințele au fost salvate cu succes!");
    } catch (err: any) {
      setErrorMessage(err.message || "Eroare la salvarea preferințelor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.centerContainer} testID="loading-indicator">
            <ActivityIndicator size="large" color={COLORS.primary || "#007AFF"} />
            <Text style={styles.loadingText}>Se încarcă preferințele...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
          >
            <Text style={styles.title}>Filtre pentru recomandări</Text>

            {errorMessage ? (
              <View style={styles.errorBox} testID="error-box">
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox} testID="success-box">
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.label}>Interval vârstă (min - max)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                  placeholder="Min (18)"
                  placeholderTextColor="#888"
                  testID="min-age-input"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="numeric"
                  placeholder="Max (100)"
                  placeholderTextColor="#888"
                  testID="max-age-input"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Gen preferat</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    genderPreference === "everyone" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGenderPreference("everyone")}
                  testID="gender-everyone"
                >
                  <Text
                    style={[
                      styles.genderText,
                      genderPreference === "everyone" && styles.genderTextActive,
                    ]}
                  >
                    Toți
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    genderPreference === "female" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGenderPreference("female")}
                  testID="gender-female"
                >
                  <Text
                    style={[
                      styles.genderText,
                      genderPreference === "female" && styles.genderTextActive,
                    ]}
                  >
                    Femei
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    genderPreference === "male" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGenderPreference("male")}
                  testID="gender-male"
                >
                  <Text
                    style={[
                      styles.genderText,
                      genderPreference === "male" && styles.genderTextActive,
                    ]}
                  >
                    Bărbați
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Interese (separate prin virgulă)</Text>
              <TextInput
                style={styles.input}
                value={interestsText}
                onChangeText={setInterestsText}
                placeholder="Ex: muzică, sport, călătorii"
                placeholderTextColor="#888"
                testID="interests-input"
              />
            </View>

            <View style={styles.buttonContainer}>
              <AppButton
                title={saving ? "Se salvează..." : "Salvează"}
                onPress={handleSave}
                disabled={saving}
                testID="save-button"
              />
              <AppButton
                title="Înapoi la recomandări"
                variant="outline"
                onPress={() => router.back()}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: "100%" },
  contentContainer: {
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    padding: 20,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary || "#6C757D",
  },
  title: { color: COLORS.text || "#FFFFFF", fontSize: 30, fontWeight: "800" },
  description: {
    color: COLORS.textSecondary || "#A0A0A0",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFC9C9",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: "#E03131", fontSize: 14 },
  successBox: {
    backgroundColor: "#E6FCF5",
    borderColor: "#96F2D7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  successText: { color: "#0CA678", fontSize: 14 },
  section: { gap: 8 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text || "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text || "#FFFFFF",
  },
  halfInput: { width: "48%" },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary || "#007AFF",
    borderColor: COLORS.primary || "#007AFF",
  },
  genderText: {
    fontSize: 14,
    color: COLORS.textSecondary || "#A0A0A0",
    fontWeight: "500",
  },
  genderTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 12,
    marginTop: 12,
  },
});
