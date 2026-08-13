import { COLORS } from "@/constants/colors";
import { INTEREST_CATEGORIES } from "@/constants/profileOptions";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type InterestSelectorProps = {
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  disabled?: boolean;
};

export function InterestSelector({
  selectedInterests,
  onToggleInterest,
  disabled = false,
}: InterestSelectorProps) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Interese</Text>
        <Text style={styles.counter}>{selectedInterests.length} selectate</Text>
      </View>

      <View style={styles.categories}>
        {INTEREST_CATEGORIES.map((category) => {
          const isOpen = openCategoryId === category.id;
          const selectedCount = category.interests.filter((interest) =>
            selectedInterests.includes(interest),
          ).length;

          return (
            <View key={category.id} style={styles.categoryContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen, disabled }}
                disabled={disabled}
                onPress={() => setOpenCategoryId(isOpen ? null : category.id)}
                style={[
                  styles.categoryButton,
                  isOpen && styles.categoryButtonOpen,
                ]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    isOpen && styles.categoryLabelOpen,
                  ]}
                >
                  {category.label}
                </Text>
                <View style={styles.categoryMeta}>
                  {selectedCount > 0 ? (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{selectedCount}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.chevron}>{isOpen ? "−" : "+"}</Text>
                </View>
              </Pressable>

              {isOpen ? (
                <View style={styles.interests}>
                  {category.interests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);

                    return (
                      <Pressable
                        key={interest}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected, disabled }}
                        disabled={disabled}
                        onPress={() => onToggleInterest(interest)}
                        style={[
                          styles.interest,
                          isSelected && styles.interestSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.interestText,
                            isSelected && styles.interestTextSelected,
                          ]}
                        >
                          {interest}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  counter: { color: COLORS.textSecondary, fontSize: 14 },
  categories: { gap: 10 },
  categoryContainer: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.canvas,
  },
  categoryButton: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryButtonOpen: { backgroundColor: COLORS.primarySoft },
  categoryLabel: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  categoryLabelOpen: { color: COLORS.primary },
  categoryMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  countText: { color: COLORS.background, fontSize: 12, fontWeight: "800" },
  chevron: { color: COLORS.primary, fontSize: 23, fontWeight: "500" },
  interests: {
    padding: 14,
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    backgroundColor: COLORS.primarySoft,
  },
  interest: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 22,
    backgroundColor: COLORS.background,
  },
  interestSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.canvas,
  },
  interestText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  interestTextSelected: { color: COLORS.primary, fontWeight: "700" },
});
