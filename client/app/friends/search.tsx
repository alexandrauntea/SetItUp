import { ScreenBackground } from "@/components/ScreenBackground";
import { UserSearchCard } from "@/components/social/UserSearchCard";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { sendFriendRequest } from "@/services/social/friendRequestSendService";
import { findUserByUsername } from "@/services/social/userSearchService";
import type { UserSearchResult } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getSendErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FRIEND_REQUEST_ALREADY_EXISTS") {
      return "Există deja o cerere între voi.";
    }

    if (error.message === "ALREADY_FRIENDS") {
      return "Sunteți deja prieteni.";
    }
  }

  return "Cererea nu a putut fi trimisă. Încearcă din nou.";
}

export default function FriendSearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/friends" as Href);
    }
  }

  async function handleSearch() {
    if (!user) return;

    Keyboard.dismiss();
    setMessage("");
    setResult(null);
    setIsSearching(true);

    try {
      const foundUser = await findUserByUsername(username, user.uid);
      setResult(foundUser);

      if (!foundUser) {
        setMessage("Nu am găsit niciun utilizator cu acest username.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "CANNOT_SEARCH_SELF") {
        setMessage("Acesta este contul tău.");
      } else {
        setMessage("Căutarea nu a reușit. Încearcă din nou.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSendRequest() {
    if (!user || !profile || !result) return;

    setMessage("");
    setIsSending(true);

    try {
      await sendFriendRequest({
        senderId: user.uid,
        senderUsername: profile.username,
        receiverId: result.uid,
        receiverUsername: result.username,
      });

      setResult((currentResult) =>
        currentResult
          ? { ...currentResult, relationshipState: "request-sent" }
          : null,
      );
      setMessage("Cererea de prietenie a fost trimisă.");
    } catch (error) {
      setMessage(getSendErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.page}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryPressed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerCard}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Înapoi"
                hitSlop={8}
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Ionicons name="arrow-back" size={23} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.title}>Caută prieteni</Text>
            </LinearGradient>

            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <TextInput
                  accessibilityLabel="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Caută după username"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => void handleSearch()}
                  style={styles.searchInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Caută"
                accessibilityState={{
                  disabled: !username.trim() || isSearching,
                  busy: isSearching,
                }}
                disabled={!username.trim() || isSearching}
                onPress={() => void handleSearch()}
                style={({ pressed }) => [
                  styles.searchButton,
                  (!username.trim() || isSearching) &&
                    styles.searchButtonDisabled,
                  pressed && styles.searchButtonPressed,
                ]}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.searchButtonText}>Caută</Text>
                )}
              </Pressable>
            </View>

            {result ? (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Rezultate</Text>
                <UserSearchCard
                  result={result}
                  isSending={isSending}
                  onSendRequest={() => void handleSendRequest()}
                  onOpenProfile={() =>
                    router.push({
                      pathname: "/users/[uid]",
                      params: { uid: result.uid },
                    })
                  }
                />
              </View>
            ) : null}

            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },
  page: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primaryPressed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { color: COLORS.background, fontSize: 24, fontWeight: "bold" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInputContainer: {
    minHeight: 50,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 0 },
  searchButton: {
    minWidth: 82,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: COLORS.text,
  },
  searchButtonDisabled: { opacity: 0.45 },
  searchButtonPressed: { backgroundColor: COLORS.textSecondary },
  searchButtonText: { color: COLORS.background, fontSize: 15, fontWeight: "700" },
  resultsSection: { gap: 12, marginTop: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  message: {
    padding: 16,
    borderRadius: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.background,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
});
