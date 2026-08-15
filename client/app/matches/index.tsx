import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchesScreen() {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Match-uri</Text>
          <View style={styles.emptyCard}>
            <Ionicons color={COLORS.primary} name="heart-outline" size={42} />
            <Text style={styles.emptyTitle}>Niciun match încă</Text>
            <Text style={styles.description}>
              Match-urile reciproce vor apărea aici.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", gap: 24, padding: 20, paddingBottom: 120 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800" },
  emptyCard: { alignItems: "center", gap: 10, padding: 28, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, backgroundColor: COLORS.background },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  description: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 21 },
});
