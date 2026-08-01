import { AppButton } from "@/components/AppButton";
import { AppCheckbox } from "@/components/AppCheckbox";
import { AppInput } from "@/components/AppInput";
import { FormError } from "@/components/FormError";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("Andrei Barbuceanu");
  const [description, setDescription] = useState("Esti fabrica de bani.");
  const [occupation, setOccupation] = useState("Student");
  const [gender, setGender] = useState("Masculin");
  const [interests, setInterests] = useState("Bani, Bani, Bani");
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");

  function handleSave() {
    if (!name.trim()) {
      setFormError("Numele este obligatoriu.");
      return;
    }

    setFormError("");

    Alert.alert("SetItUp", "Profilul a fost salvat.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.form}>
        <Text style={styles.title}>Editează profilul</Text>

        <AppInput
          label="Nume"
          placeholder="Introdu numele"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          label="Descriere"
          placeholder="Scrie câteva lucruri despre tine"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.descriptionInput}
        />

        <AppInput
          label="Ocupație"
          placeholder="Exemplu: Student"
          value={occupation}
          onChangeText={setOccupation}
        />

        <AppInput
          label="Gen"
          placeholder="Introdu genul"
          value={gender}
          onChangeText={setGender}
        />

        <AppInput
          label="Interese"
          placeholder="Muzică, călătorii, tehnologie"
          value={interests}
          onChangeText={setInterests}
        />

        <AppCheckbox
          label="Profil privat"
          value={isPrivate}
          onValueChange={setIsPrivate}
        />

        <FormError message={formError} />

        <AppButton title="Salvează modificările" onPress={handleSave} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 16,
    padding: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 24,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },
});
