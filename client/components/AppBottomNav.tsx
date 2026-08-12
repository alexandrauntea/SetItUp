import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter, useSegments } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavItemProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function NavItem({ active, icon, label, onPress }: NavItemProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Ionicons
        color={active ? COLORS.primary : COLORS.textSecondary}
        name={icon}
        size={24}
      />
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

export function AppBottomNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const isProfile = segments[0] === "profile" && segments[1] === "view";
  const isFriends = segments[0] === "friends";

  if (!isProfile && !isFriends) return null;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <NavItem
        active={isProfile}
        icon={isProfile ? "person" : "person-outline"}
        label="Profile"
        onPress={() => router.replace("/profile/view")}
      />
      <NavItem
        active={isFriends}
        icon={isFriends ? "people" : "people-outline"}
        label="Friends"
        onPress={() => router.replace("/friends" as Href)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 28,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  pressed: { opacity: 0.65 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  activeLabel: { color: COLORS.primary, fontWeight: "800" },
});
