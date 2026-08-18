import { InterestSelector } from "@/components/InterestSelector";
import { COLORS } from "@/constants/colors";
import { Gender } from "@/types/social";
import { FeedFilterPreferences } from "@/types/feed";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface FeedFilterModalProps {
  visible: boolean;
  initialFilters?: FeedFilterPreferences;
  onApply: (filters: FeedFilterPreferences) => void;
  onClose: () => void;
}

export function FeedFilterModal({
  visible,
  initialFilters,
  onApply,
  onClose,
}: FeedFilterModalProps) {
  const [minAge, setMinAge] = useState<string>(
    initialFilters?.minAge ? String(initialFilters.minAge) : ""
  );
  const [maxAge, setMaxAge] = useState<string>(
    initialFilters?.maxAge ? String(initialFilters.maxAge) : ""
  );
  const [selectedGender, setSelectedGender] = useState<Gender | "any">(
    initialFilters?.gender || "any"
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialFilters?.interests || []
  );

  function handleApply() {
    const parsedMinAge = minAge ? parseInt(minAge, 10) : undefined;
    const parsedMaxAge = maxAge ? parseInt(maxAge, 10) : undefined;

    onApply({
      minAge: isNaN(parsedMinAge as number) ? undefined : parsedMinAge,
      maxAge: isNaN(parsedMaxAge as number) ? undefined : parsedMaxAge,
      gender: selectedGender,
      interests: selectedInterests,
    });
    onClose();
  }

  function handleReset() {
    setMinAge("");
    setMaxAge("");
    setSelectedGender("any");
    setSelectedInterests([]);
    onApply({});
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container} testID="filter-modal-container">
          <View style={styles.header}>
            <Text style={styles.title}>Filtre Preferințe</Text>
            <TouchableOpacity onPress={onClose} testID="filter-close-header">
              <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Age Range */}
            <Text style={styles.sectionTitle}>Vârstă</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageInputBox}>
                <Text style={styles.inputLabel}>Min</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setMinAge}
                  placeholder="18"
                  style={styles.input}
                  value={minAge}
                  testID="filter-min-age"
                />
              </View>
              <Text style={styles.ageSeparator}>-</Text>
              <View style={styles.ageInputBox}>
                <Text style={styles.inputLabel}>Max</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setMaxAge}
                  placeholder="99"
                  style={styles.input}
                  value={maxAge}
                  testID="filter-max-age"
                />
              </View>
            </View>

            {/* Gender Preference */}
            <Text style={styles.sectionTitle}>Gen</Text>
            <View style={styles.genderRow}>
              {[
                { label: "Oricare", value: "any" },
                { label: "Feminin", value: "female" },
                { label: "Masculin", value: "male" },
                { label: "Altul", value: "other" },
              ].map((g) => {
                const isSelected = selectedGender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[
                      styles.genderChip,
                      isSelected && styles.genderChipSelected,
                    ]}
                    onPress={() => setSelectedGender(g.value as Gender | "any")}
                    testID={`filter-gender-${g.value}`}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        isSelected && styles.genderChipTextSelected,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Interests */}
            <Text style={styles.sectionTitle}>Interese</Text>
            <InterestSelector
              selectedInterests={selectedInterests}
              onToggleInterest={(interest) => {
                if (selectedInterests.includes(interest)) {
                  setSelectedInterests(
                    selectedInterests.filter((i) => i !== interest)
                  );
                } else {
                  setSelectedInterests([...selectedInterests, interest]);
                }
              }}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              testID="filter-reset-button"
            >
              <Text style={styles.resetButtonText}>Resetează</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              testID="filter-apply-button"
            >
              <Text style={styles.applyButtonText}>Aplică filtre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  body: {
    flexGrow: 0,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ageInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  ageSeparator: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "bold",
  },
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  genderChipSelected: {
    backgroundColor: COLORS.primary,
  },
  genderChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  genderChipTextSelected: {
    color: COLORS.background,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  resetButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  applyButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "800",
  },
});