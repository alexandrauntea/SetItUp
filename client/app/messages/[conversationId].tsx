import { PageBanner } from "@/components/PageBanner";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  blockUser,
  sendMessage,
  subscribeToConversation,
  subscribeToMessages,
  unblockUser,
} from "@/services/messagingService";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { Conversation, Message } from "@/types/messaging";
import type { PublicProfile } from "@/types/social";
import { requestConfirmation, showPlatformAlert } from "@/utils/platformAlert";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function firstParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = firstParam(params.conversationId);
  const listRef = useRef<FlatList<Message>>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChangingBlock, setIsChangingBlock] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const participant = useMemo(() => {
    if (!conversation || !user?.uid) return null;
    const currentIndex = conversation.managerIds.indexOf(user.uid);
    if (currentIndex < 0) return null;
    const otherIndex = currentIndex === 0 ? 1 : 0;
    return {
      managerId: conversation.managerIds[otherIndex],
      ownerId: conversation.memberIds[otherIndex],
    };
  }, [conversation, user?.uid]);

  const blocked = Boolean(conversation?.blockedBy);
  const blockedByCurrentUser = conversation?.blockedBy === user?.uid;

  useEffect(() => {
    if (!conversationId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const fail = () => {
      setHasError(true);
      setIsLoading(false);
    };
    const unsubscribeConversation = subscribeToConversation(
      conversationId,
      (nextConversation) => {
        setConversation(nextConversation);
        setHasError(!nextConversation);
        setIsLoading(false);
      },
      fail,
    );
    const unsubscribeMessages = subscribeToMessages(
      conversationId,
      setMessages,
      fail,
    );

    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    if (!participant?.ownerId) {
      setProfile(null);
      return () => {
        active = false;
      };
    }

    void getPublicProfileByUid(participant.ownerId, user?.uid)
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, [participant?.ownerId, user?.uid]);

  async function handleSend() {
    if (!conversationId || !user?.uid || !text.trim() || blocked || isSending) return;
    const pendingText = text;
    setIsSending(true);
    try {
      await sendMessage(conversationId, user.uid, pendingText);
      setText("");
    } catch {
      showPlatformAlert("Mesaj netrimis", "Nu am putut trimite mesajul. Încearcă din nou.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleBlock() {
    if (!conversationId || !user?.uid || !participant || isChangingBlock) return;
    setMenuOpen(false);
    const confirmed = await requestConfirmation({
      title: blockedByCurrentUser ? "Deblochezi utilizatorul?" : "Blochezi utilizatorul?",
      message: blockedByCurrentUser
        ? "Vei putea trimite din nou mesaje în această conversație."
        : "Istoricul rămâne vizibil, dar nu se vor mai putea trimite mesaje.",
      cancelText: "Renunță",
      confirmText: blockedByCurrentUser ? "Deblochează" : "Blochează",
      destructive: !blockedByCurrentUser,
    });
    if (!confirmed) return;

    setIsChangingBlock(true);
    try {
      if (blockedByCurrentUser) {
        await unblockUser(conversationId, user.uid, participant.managerId);
      } else {
        await blockUser(conversationId, user.uid, participant.managerId);
      }
    } catch {
      showPlatformAlert("Acțiune nereușită", "Starea conversației nu a putut fi schimbată.");
    } finally {
      setIsChangingBlock(false);
    }
  }

  function handleOpenProfile() {
    if (!participant?.ownerId || !conversationId) return;
    router.push({
      pathname: "/users/[uid]",
      params: {
        uid: participant.ownerId,
        backToChat: "true",
        conversationId,
      },
    });
  }

  if (isLoading) {
    return (
      <ScreenBackground>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.stateText}>Se încarcă conversația...</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (hasError || !conversation || !participant) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.centered}>
          <Ionicons color={COLORS.error} name="alert-circle-outline" size={42} />
          <Text style={styles.stateTitle}>Conversație indisponibilă</Text>
          <Text style={styles.stateText}>Nu ai acces sau conversația nu mai există.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>Înapoi</Text>
          </Pressable>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const profileName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Profilul potrivirii";

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <PageBanner
            action={(
              <>
                <Pressable accessibilityLabel="Acțiuni conversație" accessibilityRole="button" onPress={() => setMenuOpen((open) => !open)} style={styles.bannerActionButton}>
                  <Ionicons color={COLORS.background} name="ellipsis-vertical" size={23} />
                </Pressable>
                {menuOpen ? (
                  <View style={styles.menu}>
                    <Pressable
                      accessibilityLabel={blockedByCurrentUser ? "Deblochează" : "Blochează"}
                      accessibilityRole="button"
                      disabled={(blocked && !blockedByCurrentUser) || isChangingBlock}
                      onPress={() => void handleToggleBlock()}
                      style={styles.menuAction}
                    >
                      <Text style={[styles.menuText, !blockedByCurrentUser && styles.menuTextDanger]}>
                        {blockedByCurrentUser ? "Deblochează" : "Blochează"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}
            contentAccessibilityLabel="Vezi profilul"
            onBack={() => router.back()}
            onContentPress={profile ? handleOpenProfile : undefined}
            title={profileName}
          />

          <FlatList
            contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
            data={messages}
            keyExtractor={(message) => message.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Începe conversația cu un mesaj.</Text>}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ref={listRef}
            renderItem={({ item }) => {
              const own = item.senderId === user?.uid;
              return (
                <View style={[styles.bubble, own ? styles.ownBubble : styles.receivedBubble]}>
                  <Text style={[styles.messageText, own && styles.ownMessageText]}>{item.text}</Text>
                  <Text style={[styles.messageTime, own && styles.ownMessageTime]}>
                    {new Date(item.createdAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              );
            }}
          />

          {blocked ? (
            <View style={styles.blockedNotice}>
              <Text style={styles.blockedText}>Utilizatorul este blocat. Nu îi poți trimite mesaje.</Text>
            </View>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Mesaj"
              editable={!blocked && !isSending}
              maxLength={2000}
              multiline
              onChangeText={setText}
              onSubmitEditing={() => void handleSend()}
              placeholder={blocked ? "Mesageria este blocată" : "Scrie un mesaj..."}
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.input, blocked && styles.inputDisabled]}
              value={text}
            />
            <Pressable
              accessibilityLabel="Trimite mesajul"
              accessibilityRole="button"
              accessibilityState={{ disabled: blocked || !text.trim() || isSending }}
              disabled={blocked || !text.trim() || isSending}
              onPress={() => void handleSend()}
              style={({ pressed }) => [styles.sendButton, (blocked || !text.trim() || isSending) && styles.sendButtonDisabled, pressed && styles.pressed]}
            >
              {isSending ? <ActivityIndicator color={COLORS.background} size="small" /> : <Ionicons color={COLORS.background} name="send" size={20} />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },
  keyboardView: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  stateTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800", textAlign: "center" },
  stateText: { color: COLORS.textSecondary, fontSize: 15, textAlign: "center" },
  retryButton: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.background, fontWeight: "700" },
  bannerActionButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21 },
  menu: { zIndex: 1000, position: "absolute", top: 48, right: 0, minWidth: 170, padding: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.background, shadowColor: COLORS.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 24 },
  menuAction: { padding: 12 },
  menuText: { color: COLORS.primary, fontWeight: "700" },
  menuTextDanger: { color: COLORS.error },
  messageList: { zIndex: 0, flexGrow: 1, gap: 8, padding: 16, paddingBottom: 20 },
  emptyList: { justifyContent: "center" },
  emptyText: { color: COLORS.textSecondary, textAlign: "center" },
  bubble: { maxWidth: "82%", gap: 3, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 5, backgroundColor: COLORS.primarySoft },
  receivedBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  messageText: { color: COLORS.text, fontSize: 16, lineHeight: 21 },
  ownMessageText: { color: COLORS.primaryPressed },
  messageTime: { color: COLORS.textSecondary, fontSize: 10, alignSelf: "flex-end" },
  ownMessageTime: { color: COLORS.primaryPressed },
  blockedNotice: { alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.errorBackground },
  blockedText: { color: COLORS.error, fontSize: 13, fontWeight: "600", textAlign: "center" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 28, backgroundColor: COLORS.background },
  input: { flex: 1, minHeight: 44, maxHeight: 112, paddingHorizontal: 15, paddingVertical: 11, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, color: COLORS.text, backgroundColor: COLORS.canvas, fontSize: 16 },
  inputDisabled: { opacity: 0.55 },
  sendButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: COLORS.primary },
  sendButtonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
