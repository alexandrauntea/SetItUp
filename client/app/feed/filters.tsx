import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedFiltersScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Filtre feed</Text>
          <Text style={styles.description}>
            Aici vor fi configurate vârsta, genul și interesele profilurilor afișate.
          </Text>
          <AppButton title="Înapoi la feed" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", justifyContent: "center", gap: 18, padding: 20 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800" },
  description: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 23 },
});
