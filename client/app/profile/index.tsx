import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const mockProfile = {
  name: "Andrei Barbuceanu",
  username: "andrei",
  description: "Esti fabrica de bani.",
  occupation: "Student",
  age: 21,
  gender: "Masculin",
  isPrivate: false,
  interests: ["Bani", "Bani", "Bani"],
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AB</Text>
        </View>

        <Text style={styles.name}>{mockProfile.name}</Text>
        <Text style={styles.username}>@{mockProfile.username}</Text>

        <Text style={styles.description}>{mockProfile.description}</Text>

        <View style={styles.details}>
          <Text style={styles.detail}>Ocupație: {mockProfile.occupation}</Text>

          <Text style={styles.detail}>Vârstă: {mockProfile.age}</Text>

          <Text style={styles.detail}>Gen: {mockProfile.gender}</Text>

          <Text style={styles.detail}>
            Profil: {mockProfile.isPrivate ? "Privat" : "Public"}
          </Text>
        </View>

        <View style={styles.interests}>
          {mockProfile.interests.map((interest, index) => (
            <View key={`${interest}-${index}`} style={styles.interest}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>

        <AppButton title="Editează profilul" onPress={handleEditProfile} />

        <AppButton title="Logout" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 40,
    backgroundColor: COLORS.background,
  },
  profile: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 50,
  },
  avatarText: {
    color: COLORS.background,
    fontSize: 32,
    fontWeight: "bold",
  },
  name: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "bold",
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  description: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  details: {
    width: "100%",
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  detail: {
    color: COLORS.text,
    fontSize: 15,
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  interest: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
  },
  interestText: {
    color: COLORS.text,
    fontSize: 14,
  },
});
