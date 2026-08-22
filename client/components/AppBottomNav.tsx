import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter, useSegments } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavItemProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showLabel: boolean;
};

function NavItem({ active, icon, label, onPress, showLabel }: NavItemProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        !showLabel && styles.iconOnlyItem,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        color={active ? COLORS.primary : COLORS.textSecondary}
        name={icon}
        size={showLabel ? 24 : 28}
      />
      {showLabel ? (
        <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

export function AppBottomNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showLabels = width >= 600;
  const rootSegment = segments[0] as string | undefined;
  const isProfile = rootSegment === "profile" && segments[1] === "view";
  const isFriends = rootSegment === "friends";
  const isFeed = rootSegment === "feed";
  const isMatches = rootSegment === "matches";
  const isMessages = rootSegment === "messages" && segments.length === 1;

  if (!isProfile && !isFriends && !isFeed && !isMatches && !isMessages) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <NavItem
        active={isProfile}
        icon={isProfile ? "person" : "person-outline"}
        label="Profil"
        onPress={() => router.replace("/profile/view")}
        showLabel={showLabels}
      />
      <NavItem
        active={isFriends}
        icon={isFriends ? "people" : "people-outline"}
        label="Prieteni"
        onPress={() => router.replace("/friends" as Href)}
        showLabel={showLabels}
      />
      <NavItem
        active={isFeed}
        icon={isFeed ? "flame" : "flame-outline"}
        label="Recomandări"
        onPress={() => router.replace("/feed" as Href)}
        showLabel={showLabels}
      />
      <NavItem
        active={isMatches}
        icon={isMatches ? "heart" : "heart-outline"}
        label="Potriviri"
        onPress={() => router.replace("/matches" as Href)}
        showLabel={showLabels}
      />
      <NavItem
        active={isMessages}
        icon={isMessages ? "chatbubbles" : "chatbubbles-outline"}
        label="Mesaje"
        onPress={() => router.replace("/messages" as Href)}
        showLabel={showLabels}
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
    paddingHorizontal: 12,
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
  iconOnlyItem: {
    minHeight: 48,
  },
  pressed: { opacity: 0.65 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  activeLabel: { color: COLORS.primary, fontWeight: "800" },
});
