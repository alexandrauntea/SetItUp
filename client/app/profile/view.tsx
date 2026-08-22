import { AppButton } from "@/components/AppButton";
import { PageBanner } from "@/components/PageBanner";
import { ProfilePhotoGallery } from "@/components/ProfilePhotoGallery";
import { LoadingState } from "@/components/LoadingState";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { GENDER_OPTIONS } from "@/constants/profileOptions";
import { useProfile } from "@/contexts/ProfileContext";
import { logoutUser } from "@/services/authService";
import { calculateAgeFromBirthDate } from "@/utils/profileData";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  if (!profile) {
    return (
      <ScreenBackground>
        <LoadingState
          accessibilityLabel="Se încarcă profilul"
          fullScreen
          message="Se încarcă profilul..."
        />
      </ScreenBackground>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const age = calculateAgeFromBirthDate(profile.birthDate);
  const genderLabel =
    GENDER_OPTIONS.find((option) => option.value === profile.gender)?.label ??
    profile.gender;

  function handleEditProfile() {
    router.push("/profile/edit");
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.info("Deconectarea a eșuat:", error);
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <PageBanner
              title={`${fullName}${age > 0 ? `, ${age}` : ""}`}
              subtitle={`@${profile.username}`}
            />

            <ProfilePhotoGallery
              name={fullName}
              photoPaths={profile.photoPaths}
              primaryPhotoPath={profile.primaryPhotoPath}
              primaryPhotoUrl={profile.photoUrl}
            />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despre mine</Text>
            <Text style={styles.description}>{profile.description}</Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Informații</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="briefcase-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.infoLabel}>Ocupație</Text>
                <Text style={styles.infoValue}>{profile.occupation}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="male-female-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.infoLabel}>Gen</Text>
                <Text style={styles.infoValue}>{genderLabel}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.infoLabel}>Vârstă</Text>
                <Text style={styles.infoValue}>
                  {age > 0 ? `${age} ani` : "—"}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name={
                      profile.isPrivate
                        ? "lock-closed-outline"
                        : "eye-outline"
                    }
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.infoLabel}>Vizibilitate</Text>
                <Text style={styles.infoValue}>
                  {profile.isPrivate ? "Privat" : "Public"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, styles.interestsSection]}>
            <Text style={styles.sectionTitle}>Interese</Text>

            <View style={styles.interests}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton title="Editează profilul" onPress={handleEditProfile} />
            <AppButton
              title="Deconectare"
              onPress={handleLogout}
              variant="outline"
            />
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 120,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
  },
  section: {
    padding: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 140,
    gap: 5,
    padding: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    borderRadius: 18,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  infoIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestsSection: {
    backgroundColor: "#FFF8F8",
    borderColor: COLORS.primarySoft,
  },
  interest: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    borderRadius: 20,
  },
  interestText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
});
