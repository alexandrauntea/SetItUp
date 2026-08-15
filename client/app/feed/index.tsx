import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
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

export default function FeedScreen() {
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
              <Text style={styles.title}>Feed</Text>
              <Text style={styles.subtitle}>
                Descoperă profiluri potrivite pentru ownerul gestionat
              </Text>
            </LinearGradient>

            <View style={styles.shortcuts}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/feed/filters")}
                style={({ pressed }) => [
                  styles.shortcut,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons
                    color={COLORS.primary}
                    name="options-outline"
                    size={23}
                  />
                </View>
                <View style={styles.shortcutText}>
                  <Text style={styles.shortcutLabel}>Filtre</Text>
                  <Text style={styles.shortcutDescription}>Preferințe feed</Text>
                </View>
                <Ionicons
                  color={COLORS.textSecondary}
                  name="chevron-forward"
                  size={18}
                />
              </Pressable>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Profiluri recomandate</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Feed activ</Text>
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
  subtitle: {
    maxWidth: 310,
    color: COLORS.background,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.88,
  },
  shortcuts: { gap: 10 },
  shortcut: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  shortcutText: { flex: 1, gap: 2 },
  shortcutLabel: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  shortcutDescription: { color: COLORS.textSecondary, fontSize: 13 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: { flex: 1, color: COLORS.text, fontSize: 21, fontWeight: "800" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  liveText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
