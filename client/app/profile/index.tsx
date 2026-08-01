import { AppButton } from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockProfile = {
  name: "Andrei Barbuceanu",
  username: "andrei",
  description:
    "Îmi place să cunosc oameni noi și să descopăr lucruri interesante.",
  occupation: "Student",
  age: 21,
  gender: "Masculin",
  isPrivate: false,
  interests: ["Tehnologie", "Muzică", "Călătorii"],
};

export default function ProfileScreen() {
  const router = useRouter();

  function handleEditProfile() {
    router.push("/profile/edit");
  }

  function handleLogout() {
    router.replace("/login");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AB</Text>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.name}>{mockProfile.name}</Text>
              <Text style={styles.age}>{mockProfile.age}</Text>
            </View>

            <Text style={styles.username}>@{mockProfile.username}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despre mine</Text>
            <Text style={styles.description}>{mockProfile.description}</Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Informații</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons
                  name="briefcase-outline"
                  size={21}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Ocupație</Text>
                <Text style={styles.infoValue}>{mockProfile.occupation}</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons
                  name="male-female-outline"
                  size={21}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Gen</Text>
                <Text style={styles.infoValue}>{mockProfile.gender}</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Vârstă</Text>
                <Text style={styles.infoValue}>{mockProfile.age} ani</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons
                  name={mockProfile.isPrivate ? "lock-closed-outline" : "eye-outline"}
                  size={21}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Vizibilitate</Text>
                <Text style={styles.infoValue}>
                  {mockProfile.isPrivate ? "Privat" : "Public"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interese</Text>

            <View style={styles.interests}>
              {mockProfile.interests.map((interest) => (
                <View key={interest} style={styles.interest}>
                  <Ionicons
                    name="heart-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton title="Editează profilul" onPress={handleEditProfile} />
            <AppButton
              title="Deconectare"
              onPress={handleLogout}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  container: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.canvas,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
  },
  headerCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 48,
    borderWidth: 5,
    borderColor: COLORS.background,
  },
  avatarText: {
    color: COLORS.background,
    fontSize: 30,
    fontWeight: "bold",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  age: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontWeight: "600",
  },
  username: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  section: {
    padding: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 140,
    gap: 5,
    padding: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 18,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    borderRadius: 20,
  },
  interestText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
});
