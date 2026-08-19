import { ScreenBackground } from "@/components/ScreenBackground";
import { PageBanner } from "@/components/PageBanner";
import { FriendsCard } from "@/components/social/FriendsCard";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { getFriends, removeFriend } from "@/services/social/friendshipService";
import type { Friendship } from "@/types/social";
import {
  requestConfirmation,
  showPlatformAlert,
} from "@/utils/platformAlert";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ShortcutProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function Shortcut({ icon, label, onPress }: ShortcutProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons color={COLORS.primary} name={icon} size={23} />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setErrorMessage("");
    try {
      setFriends(await getFriends(user.uid));
    } catch (error) {
      console.info("Nu am putut încărca lista de prieteni:", error);
      setErrorMessage("Lista de prieteni nu a putut fi încărcată.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  function getFriend(friendship: Friendship) {
    const ownIndex = friendship.memberIds[0] === user?.uid ? 0 : 1;
    const friendIndex = ownIndex === 0 ? 1 : 0;
    return {
      uid: friendship.memberIds[friendIndex],
      username: friendship.memberUsernames[friendIndex],
    };
  }

  async function confirmRemove(friendship: Friendship) {
    if (!user) return;
    const friend = getFriend(friendship);
    const confirmed = await requestConfirmation({
      title: "Elimini prietenul?",
      message: `@${friend.username} va fi eliminat din lista ta. Orice relație de manager dintre voi va fi eliminată.`,
      cancelText: "Anulează",
      confirmText: "Elimină",
      destructive: true,
    });

    if (!confirmed) return;

    setRemovingUid(friend.uid);
    try {
      await removeFriend(user.uid, friend.uid);
      setFriends((current) =>
        current.filter((item) => item.id !== friendship.id),
      );
    } catch (error) {
      console.info("Prietenul nu a putut fi eliminat:", error);
      showPlatformAlert("Eroare", "Prietenul nu a putut fi eliminat.");
    } finally {
      setRemovingUid(null);
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isCompact && styles.containerCompact,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void loadFriends();
              }}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <PageBanner title="Prieteni" />

            <View style={[styles.shortcuts, isCompact && styles.shortcutsCompact]}>
              <Shortcut icon="search-outline" label="Caută" onPress={() => router.push("/friends/search")} />
              <Shortcut icon="mail-unread-outline" label="Cereri" onPress={() => router.push("/friends/requests" as Href)} />
              <Shortcut icon="person-circle-outline" label="Manager" onPress={() => router.push("/friends/manager")} />
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Lista de prieteni</Text>
              <Text style={styles.count}>{friends.length}</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} size="large" />
            ) : errorMessage ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{errorMessage}</Text>
                <Pressable onPress={() => void loadFriends()}>
                  <Text style={styles.retry}>Încearcă din nou</Text>
                </Pressable>
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons color={COLORS.primary} name="people-outline" size={36} />
                <Text style={styles.emptyText}>Nu ai prieteni încă.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {friends.map((friendship) => {
                  const friend = getFriend(friendship);
                  return (
                    <FriendsCard
                      key={friendship.id}
                      username={friend.username}
                      isRemoving={removingUid === friend.uid}
                      onOpenProfile={() => router.push({ pathname: "/users/[uid]", params: { uid: friend.uid } })}
                      onRemove={() => {
                        void confirmRemove(friendship);
                      }}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 120 },
  containerCompact: { paddingHorizontal: 14 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 22 },
  shortcuts: { flexDirection: "row", gap: 10 },
  shortcutsCompact: { gap: 6 },
  shortcut: {
    flex: 1,
    minHeight: 94,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
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
  shortcutLabel: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
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
  list: { gap: 12 },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  emptyText: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  retry: { color: COLORS.primary, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
