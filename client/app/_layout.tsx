import "@/services/firebase";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { AppButton } from "@/components/AppButton";
import { LoadingState } from "@/components/LoadingState";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { logoutUser } from "@/services/authService";
import { AppBottomNav } from "@/components/AppBottomNav";

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
      console.info("Deconectarea a eșuat:", error);
    }
  }

  useEffect(() => {
    if (isLoading || (user && isProfileLoading)) return;

    const currentPath = segments.join("/");
    const inAuthGroup = segments[0] === "(auth)";
    const inCreateProfile = currentPath === "profile/create";
    const inRecoverProfile = currentPath === "profile/recover";

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
      <ScreenBackground>
        <LoadingState
          accessibilityLabel="Se încarcă aplicația"
          fullScreen
          message="Se încarcă aplicația..."
        />
      </ScreenBackground>
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
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="feed" options={{ headerShown: false }} />
        <Stack.Screen name="matches" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="users/[uid]" options={{ headerShown: false }} />
      </Stack>
      <AppBottomNav />
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
