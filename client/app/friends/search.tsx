import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenBackground } from "@/components/ScreenBackground";
import { UserSearchCard } from "@/components/social/UserSearchCard";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { sendFriendRequest } from "@/services/social/friendRequestSendService";
import { searchUserByUsername } from "@/services/social/userSearchService";
import type { UserSearchResult } from "@/types/social";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
      router.replace("/profile/view");
    }
  }

  async function handleSearch() {
    if (!user) return;

    Keyboard.dismiss();
    setMessage("");
    setResult(null);
    setIsSearching(true);

    try {
      const foundUser = await searchUserByUsername(user.uid, username);
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
          <View style={styles.card}>
            <View style={styles.heading}>
              <Text style={styles.title}>Caută prieteni</Text>
              <Text style={styles.description}>
                Scrie username-ul exact al persoanei pe care o cauți.
              </Text>
            </View>

            <AppInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="De exemplu: anca_21"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => void handleSearch()}
            />
            <AppButton
              title="Caută"
              onPress={() => void handleSearch()}
              loading={isSearching}
              disabled={!username.trim()}
            />

            {result ? (
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
            ) : null}

            {message ? <Text style={styles.message}>{message}</Text> : null}

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
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backText}>Înapoi</Text>
            </Pressable>
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
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 18,
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  heading: { gap: 6 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800" },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  message: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    minHeight: 44,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backArrow: {
    color: COLORS.primary,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "600",
  },
  backText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
