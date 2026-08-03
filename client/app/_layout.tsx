import "@/services/firebase";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const { profile, isProfileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || (user && isProfileLoading)) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCreateProfile =
      segments[0] === "profile" && segments[1] === "create";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && (!profile || !profile.profileCompleted) && !inCreateProfile) {
      router.replace("/profile/create");
      return;
    }

    if (user && profile?.profileCompleted && (inAuthGroup || inCreateProfile)) {
      router.replace("/profile/view");
    }
  }, [isLoading, isProfileLoading, profile, router, segments, user]);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <RootLayoutNav />
      </ProfileProvider>
    </AuthProvider>
  );
}
