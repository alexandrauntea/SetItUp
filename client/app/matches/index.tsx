import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isCompact && styles.containerCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryPressed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.headerCard, isCompact && styles.headerCardCompact]}
            >
              <Text style={styles.title}>Match-uri</Text>
              <Text style={styles.subtitle}>
                Conexiunile create din aprecieri reciproce
              </Text>
            </LinearGradient>

            <View style={styles.shortcuts}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/feed")}
                style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons color={COLORS.primary} name="albums-outline" size={23} />
                </View>
                <Text style={styles.shortcutLabel}>Înapoi la Feed</Text>
                <Ionicons color={COLORS.textSecondary} name="chevron-forward" size={18} />
              </Pressable>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Conexiuni active</Text>
              <Text style={styles.count}>0</Text>
            </View>

            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons color={COLORS.primary} name="heart-outline" size={36} />
              </View>
              <Text style={styles.emptyTitle}>Niciun match încă</Text>
              <Text style={styles.description}>
                Continuă să descoperi profiluri. Match-urile reciproce vor apărea aici.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/feed")}
                style={({ pressed }) => [styles.feedButton, pressed && styles.pressed]}
              >
                <Ionicons color={COLORS.background} name="sparkles-outline" size={18} />
                <Text style={styles.feedButtonText}>Descoperă profiluri</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingBottom: 120 },
  containerCompact: { paddingHorizontal: 14 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 22 },
  headerCard: {
    minHeight: 132,
    justifyContent: "center",
    gap: 7,
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primaryPressed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  headerCardCompact: { minHeight: 120, padding: 18, borderRadius: 20 },
  title: { color: COLORS.background, fontSize: 24, fontWeight: "bold" },
  subtitle: { color: COLORS.background, fontSize: 14, opacity: 0.88 },
  shortcuts: { gap: 10 },
  shortcut: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  shortcutIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  shortcutLabel: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "800" },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionTitle: { color: COLORS.text, fontSize: 21, fontWeight: "800" },
  count: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "800",
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
  },
  emptyCard: { alignItems: "center", gap: 10, padding: 28, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, backgroundColor: COLORS.background },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
  },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  description: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 21 },
  feedButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  feedButtonText: { color: COLORS.background, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
