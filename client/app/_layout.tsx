import "@/services/firebase";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </ProfileProvider>
  );
}
