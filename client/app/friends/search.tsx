import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { sendFriendRequest } from "@/services/social/friendRequestSendService";
import { searchUserByUsername } from "@/services/social/userSearchService";
import type { RelationshipState, UserSearchResult } from "@/types/social";
import { useState } from "react";
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const relationshipLabels: Record<Exclude<RelationshipState, "none">, string> = {
  "request-sent": "Cerere trimisă",
  "request-received": "Ți-a trimis o cerere",
  friends: "Sunteți prieteni",
};

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
  const { user } = useAuth();
  const { profile } = useProfile();
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

  const displayName = result?.profile
    ? `${result.profile.firstName} ${result.profile.lastName}`
    : `@${result?.username ?? ""}`;

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
              <View style={styles.resultCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {result.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identity}>
                  <Text style={styles.name}>{displayName}</Text>
                  {result.profile ? (
                    <Text style={styles.username}>@{result.username}</Text>
                  ) : (
                    <Text style={styles.username}>Profil privat</Text>
                  )}
                </View>

                {result.relationshipState === "none" ? (
                  <AppButton
                    title="Trimite cerere"
                    onPress={() => void handleSendRequest()}
                    loading={isSending}
                  />
                ) : (
                  <View style={styles.relationshipBadge}>
                    <Text style={styles.relationshipText}>
                      {relationshipLabels[result.relationshipState]}
                    </Text>
                  </View>
                )}
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
  resultCard: {
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    backgroundColor: COLORS.primarySoft,
  },
  avatarText: { color: COLORS.primary, fontSize: 22, fontWeight: "800" },
  identity: { alignItems: "center", gap: 3 },
  name: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  username: { color: COLORS.textSecondary, fontSize: 15 },
  relationshipBadge: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  relationshipText: {
    color: COLORS.primary,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  message: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
