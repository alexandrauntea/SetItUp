import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { GENDER_OPTIONS } from "@/constants/profileOptions";
import { useProfile } from "@/contexts/ProfileContext";
import { logoutUser } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function calculateAge(birthDate: string) {
  const [day, month, year] = birthDate.split("/").map(Number);

  if (!day || !month || !year) return 0;

  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;

  return age;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  if (!profile) {
    return (
      <ScreenBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            accessibilityLabel="Se încarcă profilul"
            accessibilityRole="progressbar"
            size="large"
            color={COLORS.primary}
          />
        </View>
      </ScreenBackground>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  const age = calculateAge(profile.birthDate);
  const genderLabel =
    GENDER_OPTIONS.find((option) => option.value === profile.gender)?.label ??
    profile.gender;

  function handleEditProfile() {
    router.push("/profile/edit");
  }

  function handleFindFriends() {
    router.push("/friends/search");
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Deconectarea a eșuat:", error);
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
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryPressed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerCard}
            >
              <View style={styles.avatar}>
                {profile.photoUrl ? (
                  <Image
                    source={{
                      uri: profile.photoUrl,
                      cacheKey: profile.updatedAt,
                    }}
                    contentFit="cover"
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.name}>{fullName}</Text>
                {age > 0 ? <Text style={styles.age}>{age}</Text> : null}
              </View>

              <Text style={styles.username}>@{profile.username}</Text>
            </LinearGradient>

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
                  <Ionicons
                    name="heart-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              title="Caută prieteni"
              onPress={handleFindFriends}
              variant="outline"
            />
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
  },
  headerCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primaryPressed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 5,
  },
  avatar: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: COLORS.background,
    borderRadius: 48,
    borderWidth: 5,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "bold",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    color: COLORS.background,
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  age: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 20,
    fontWeight: "600",
  },
  username: {
    marginTop: 5,
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 16,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
