import "@/services/firebase";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { logoutUser } from "@/services/authService";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const {
    profile,
    profileStatus,
    isProfileLoading,
    refreshProfile,
  } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Deconectarea a eșuat:", error);
    }
  }

  useEffect(() => {
    if (isLoading || (user && isProfileLoading)) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCreateProfile =
      segments[0] === "profile" && segments[1] === "create";
    const inRecoverProfile =
      segments[0] === "profile" && segments[1] === "recover";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && profileStatus === "missing" && !inRecoverProfile) {
      router.replace("/profile/recover");
      return;
    }

    if (
      user &&
      profileStatus === "ready" &&
      !profile?.profileCompleted &&
      !inCreateProfile
    ) {
      router.replace("/profile/create");
      return;
    }

    if (
      user &&
      profileStatus === "ready" &&
      profile?.profileCompleted &&
      (inAuthGroup || inCreateProfile || inRecoverProfile)
    ) {
      router.replace("/profile/view");
    }
  }, [
    isLoading,
    isProfileLoading,
    profile,
    profileStatus,
    router,
    segments,
    user,
  ]);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user && profileStatus === "error") {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.errorSafeArea}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Nu am putut încărca profilul</Text>
            <Text style={styles.errorDescription}>
              Verifică legătura la internet și încearcă din nou.
            </Text>
            <AppButton
              title="Încearcă din nou"
              onPress={() => void refreshProfile()}
            />
            <AppButton
              title="Ieși din cont"
              variant="outline"
              onPress={() => void handleLogout()}
            />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="profile/view" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        <Stack.Screen name="profile/create" options={{ headerShown: false }} />
        <Stack.Screen name="profile/recover" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  errorSafeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 16,
    padding: 24,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
  },
  errorDescription: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <RootLayoutNav />
      </ProfileProvider>
    </AuthProvider>
  );
}
