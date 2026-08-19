import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { GENDER_OPTIONS } from "@/constants/profileOptions";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { PublicProfile } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const params = useLocalSearchParams<{ uid?: string | string[] }>();
  const uid = Array.isArray(params.uid) ? params.uid[0] : params.uid;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      if (!uid) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Trimitem și ID-ul utilizatorului curent pentru a verifica relația de prietenie în servicii
        const publicProfile = await getPublicProfileByUid(uid, currentUser?.uid);
        if (isActive) setProfile(publicProfile);
      } catch {
        if (isActive) setHasError(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isActive = false;
    };
  }, [uid, currentUser?.uid]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/friends/search");
    }
  }

  if (isLoading) {
    return (
      <ScreenBackground>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenBackground>
    );
  }

  if (hasError || !profile) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.centered}>
          <View style={styles.messageCard}>
            <Ionicons name="lock-closed-outline" size={38} color={COLORS.primary} />
            <Text style={styles.messageTitle}>Profil indisponibil</Text>
            <Text style={styles.messageText}>
              Profilul nu mai există sau nu a putut fi încărcat.
            </Text>
            <AppButton title="Înapoi la căutare" onPress={handleBack} />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  const gender =
    GENDER_OPTIONS.find((option) => option.value === profile.gender)?.label ??
    profile.gender;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isCompact && styles.contentCompact,
          ]}
        >
          <View style={styles.navigationHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Înapoi"
              hitSlop={8}
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={23} color={COLORS.text} />
            </Pressable>
            <Text style={styles.navigationTitle}>Profil</Text>
          </View>

          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryPressed]}
            style={[styles.header, isCompact && styles.headerCompact]}
          >
            <View style={styles.avatar}>
              {profile.photoUrl ? (
                <Image
                  source={{ uri: profile.photoUrl }}
                  contentFit="cover"
                  style={styles.photo}
                />
              ) : (
                <Text style={styles.initials}>{initials.toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.name}>
              {fullName}{profile.age > 0 ? `, ${profile.age}` : ""}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despre mine</Text>
            <Text style={styles.body}>{profile.description || "Fără descriere."}</Text>
          </View>

          <View style={[styles.infoRow, isCompact && styles.infoRowCompact]}>
            <View style={styles.infoCard}>
              <Ionicons name="briefcase-outline" size={22} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Ocupație</Text>
              <Text style={styles.infoValue}>{profile.occupation}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="male-female-outline" size={22} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Gen</Text>
              <Text style={styles.infoValue}>{gender}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interese</Text>
            <View style={styles.interests}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  contentCompact: { paddingHorizontal: 14 },
  navigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.background,
  },
  backButtonPressed: { opacity: 0.65 },
  navigationTitle: { color: COLORS.text, fontSize: 27, fontWeight: "800" },
  messageCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.background,
  },
  messageTitle: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  messageText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 23,
  },
  header: { alignItems: "center", gap: 8, padding: 24, borderRadius: 24 },
  headerCompact: { padding: 20, borderRadius: 20 },
  avatar: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 6,
    borderRadius: 48,
    backgroundColor: COLORS.background,
  },
  photo: { width: "100%", height: "100%" },
  initials: { color: COLORS.primary, fontSize: 30, fontWeight: "800" },
  name: {
    color: COLORS.background,
    textAlign: "center",
    fontSize: 25,
    fontWeight: "800",
  },
  username: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  section: {
    gap: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "700" },
  body: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 23 },
  infoRow: { flexDirection: "row", gap: 12 },
  infoRowCompact: { flexDirection: "column" },
  infoCard: {
    flex: 1,
    gap: 6,
    minWidth: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interest: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
  },
  interestText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
