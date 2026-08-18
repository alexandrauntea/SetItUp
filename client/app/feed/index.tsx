import { AppButton } from "@/components/AppButton";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.content}>
            <View style={styles.heading}>
              <View>
                <Text style={styles.title}>Feed</Text>
                <Text style={styles.subtitle}>Descoperă profiluri noi</Text>
              </View>
              <View style={styles.filterButton}>
                <AppButton
                  title="Filtre"
                  variant="outline"
                  onPress={() => router.push("/feed/filters")}
                />
              </View>
            </View>
            <FeedEmptyState message="Scheletul este pregătit. Profilurile vor fi conectate prin serviciul de feed." />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingBottom: 120 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 24 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: COLORS.textSecondary, marginTop: 4 },
  filterButton: { width: 110 },
});
