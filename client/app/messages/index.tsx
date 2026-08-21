import { PageBanner } from "@/components/PageBanner";
import { ProfileImage } from "@/components/ProfileImage";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/services/firebase";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { PublicProfile } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

type Conversation = {
  id: string;
  matchId: string;
  memberIds: [string, string];
  managerIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  blockedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConversationListItem = {
  conversation: Conversation;
  profile: PublicProfile | null;
};

function getOtherMemberId(
  conversation: Conversation,
  managerId: string,
): string | null {
  const managerIndex = conversation.managerIds.indexOf(managerId);
  if (managerIndex < 0) return null;

  const otherMemberIndex = managerIndex === 0 ? 1 : 0;
  return conversation.memberIds[otherMemberIndex] ?? null;
}

function conversationSortValue(conversation: Conversation): string {
  return (
    conversation.lastMessageAt ??
    conversation.updatedAt ??
    conversation.createdAt
  );
}

export function formatConversationTime(value?: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let snapshotSequence = 0;

    if (!user?.uid) {
      setItems([]);
      setHasError(true);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setHasError(false);

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("managerIds", "array-contains", user.uid),
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const currentSequence = ++snapshotSequence;
        const conversations = snapshot.docs
          .map(
            (documentSnapshot) =>
              ({
                ...documentSnapshot.data(),
                id: documentSnapshot.id,
              }) as Conversation,
          )
          .sort((first, second) =>
            conversationSortValue(second).localeCompare(
              conversationSortValue(first),
            ),
          );

        void Promise.all(
          conversations.map(async (conversation) => {
            const otherMemberId = getOtherMemberId(conversation, user.uid);
            if (!otherMemberId) return null;

            try {
              const profile = await getPublicProfileByUid(
                otherMemberId,
                user.uid,
              );
              return { conversation, profile } satisfies ConversationListItem;
            } catch {
              return { conversation, profile: null } satisfies ConversationListItem;
            }
          }),
        ).then((loadedItems) => {
          if (!isActive || currentSequence !== snapshotSequence) return;
          setItems(
            loadedItems.filter(
              (item): item is ConversationListItem => item !== null,
            ),
          );
          setHasError(false);
          setIsLoading(false);
        });
      },
      (error) => {
        if (!isActive) return;
        console.error("Nu am putut încărca conversațiile:", error);
        setItems([]);
        setHasError(true);
        setIsLoading(false);
      },
    );

    return () => {
      isActive = false;
      snapshotSequence += 1;
      unsubscribe();
    };
  }, [user?.uid]);

  function openConversation(conversationId: string) {
    router.push({
      pathname: "/messages/[conversationId]",
      params: { conversationId },
    } as unknown as Href);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          contentContainerStyle={styles.content}
          data={items}
          keyExtractor={(item) => item.conversation.id}
          ListHeaderComponent={
            <PageBanner
              title="Mesaje"
              subtitle="Conversațiile potrivirilor tale"
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.stateTitle}>
                  Se încarcă conversațiile...
                </Text>
              </View>
            ) : hasError ? (
              <View style={styles.stateCard}>
                <Ionicons
                  color={COLORS.error}
                  name="alert-circle-outline"
                  size={38}
                />
                <Text style={styles.stateTitle}>
                  Nu am putut încărca mesajele
                </Text>
                <Text style={styles.stateDescription}>
                  Verifică legătura la internet și încearcă din nou.
                </Text>
              </View>
            ) : (
              <View style={styles.stateCard}>
                <Ionicons
                  color={COLORS.primary}
                  name="chatbubbles-outline"
                  size={38}
                />
                <Text style={styles.stateTitle}>Nicio conversație încă</Text>
                <Text style={styles.stateDescription}>
                  Conversațiile apar după ce există o potrivire.
                </Text>
              </View>
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const { conversation, profile } = item;
            const firstName = profile?.firstName?.trim() || "Profil indisponibil";
            const fullName = profile
              ? `${profile.firstName} ${profile.lastName}`.trim()
              : firstName;
            const blocked = Boolean(conversation.blockedBy);
            const unread = Boolean(
              conversation.lastMessage &&
                conversation.lastMessageSenderId &&
                conversation.lastMessageSenderId !== user?.uid,
            );
            const timestamp = formatConversationTime(
              conversation.lastMessageAt,
            );

            return (
              <Pressable
                accessibilityLabel={`Deschide conversația cu ${firstName}`}
                accessibilityRole="button"
                onPress={() => openConversation(conversation.id)}
                style={({ pressed }) => [
                  styles.conversationCard,
                  pressed && styles.pressed,
                ]}
              >
                <ProfileImage
                  name={fullName}
                  size={58}
                  uri={profile?.photoUrl}
                />

                <View style={styles.conversationContent}>
                  <View style={styles.titleRow}>
                    <Text numberOfLines={1} style={styles.firstName}>
                      {firstName}
                    </Text>
                    {timestamp ? (
                      <Text style={styles.timestamp}>{timestamp}</Text>
                    ) : null}
                  </View>

                  <View style={styles.previewRow}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.preview,
                        unread && !blocked && styles.unreadPreview,
                      ]}
                    >
                      {conversation.lastMessage || "Începe conversația"}
                    </Text>
                    {blocked ? (
                      <View style={[styles.badge, styles.blockedBadge]}>
                        <Text style={[styles.badgeText, styles.blockedBadgeText]}>
                          Blocat
                        </Text>
                      </View>
                    ) : unread ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Mesaj nou</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Ionicons
                  color={COLORS.textSecondary}
                  name="chevron-forward"
                  size={20}
                />
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  separator: { height: 12 },
  conversationCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  conversationContent: { flex: 1, minWidth: 0, gap: 7 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  firstName: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: "800" },
  timestamp: { color: COLORS.textSecondary, fontSize: 12 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { flex: 1, color: COLORS.textSecondary, fontSize: 14 },
  unreadPreview: { color: COLORS.text, fontWeight: "700" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  blockedBadge: { backgroundColor: COLORS.errorBackground },
  badgeText: { color: COLORS.background, fontSize: 10, fontWeight: "800" },
  blockedBadgeText: { color: COLORS.error },
  stateCard: {
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  stateTitle: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },
  stateDescription: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  pressed: { opacity: 0.68 },
});
