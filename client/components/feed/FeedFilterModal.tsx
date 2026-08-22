import { InterestSelector } from "@/components/InterestSelector";
import { COLORS } from "@/constants/colors";
import { Gender } from "@/types/social";
import { FeedFilterPreferences } from "@/types/feed";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container} testID="filter-modal-container">
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryPressed]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Filtre</Text>
              <Text style={styles.subtitle}>Personalizează recomandările</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Închide filtrele"
              onPress={onClose}
              style={styles.closeButton}
              testID="filter-close-header"
            >
              <Ionicons name="close" size={23} color={COLORS.primary} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.body}
          >
            {/* Age Range */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>Interval de vârstă</Text>
              </View>
              <View style={styles.ageRow}>
                <View style={styles.ageInputBox}>
                  <Text style={styles.inputLabel}>De la</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={setMinAge}
                    placeholder="18"
                    placeholderTextColor={COLORS.textSecondary}
                    style={styles.input}
                    value={minAge}
                    testID="filter-min-age"
                  />
                </View>
                <Text style={styles.ageSeparator}>–</Text>
                <View style={styles.ageInputBox}>
                  <Text style={styles.inputLabel}>Până la</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={setMaxAge}
                    placeholder="99"
                    placeholderTextColor={COLORS.textSecondary}
                    style={styles.input}
                    value={maxAge}
                    testID="filter-max-age"
                  />
                </View>
              </View>
            </View>

            {/* Gender Preference */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>Gen</Text>
              </View>
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
            </View>

            {/* Interests */}
            <View style={styles.sectionCard}>
              <View style={styles.interestsHeading}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Interese</Text>
                </View>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{selectedInterests.length}</Text>
                </View>
              </View>
              <InterestSelector
                selectedInterests={selectedInterests}
                showHeader={false}
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
            </View>
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
    padding: 16,
    backgroundColor: "rgba(26,26,26,0.58)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: COLORS.background,
    width: "100%",
    maxWidth: 540,
    maxHeight: "88%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    minHeight: 104,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCopy: { flex: 1, gap: 4 },
  title: {
    color: COLORS.background,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexShrink: 1,
    backgroundColor: COLORS.canvas,
  },
  bodyContent: { padding: 18, gap: 14 },
  sectionCard: {
    padding: 16,
    gap: 14,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  ageSeparator: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderChip: {
    flexGrow: 1,
    minWidth: 92,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
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
  interestsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadgeText: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
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
