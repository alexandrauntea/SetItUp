import { FriendRequestCard } from "@/components/social/FriendRequestCard";
import { ScreenBackground } from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
} from "@/services/social/friendRequestInboxService";
import type { FriendRequest } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FriendRequestAction = "accept" | "decline" | "cancel";

type ProcessingRequest = {
  requestId: string;
  action: FriendRequestAction;
};

function getRequestErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code).replace("firestore/", "")
      : "";
  const message = error instanceof Error ? error.message : "";

  switch (message) {
    case "FRIEND_REQUEST_NOT_FOUND":
      return "Cererea nu mai există. Actualizează lista și încearcă din nou.";
    case "FRIEND_REQUEST_NOT_PENDING":
      return "Cererea a fost deja procesată.";
    case "ONLY_RECEIVER_CAN_RESPOND":
      return "Numai destinatarul poate accepta sau refuza această cerere.";
    case "ONLY_SENDER_CAN_CANCEL":
      return "Numai expeditorul poate anula această cerere.";
    case "INVALID_FRIEND_REQUEST":
      return "Cererea conține date invalide și nu poate fi procesată.";
  }

  switch (code) {
    case "permission-denied":
      return "Firebase a refuzat accesul la cereri. Regulile Firestore trebuie actualizate.";
    case "failed-precondition":
      return "Interogarea Firestore necesită o configurare care nu este încă publicată.";
    case "unavailable":
      return "Serviciul Firestore nu este disponibil momentan. Verifică internetul și încearcă din nou.";
    default:
      return "Nu am putut actualiza cererile. Încearcă din nou.";
  }
}

export default function FriendRequestsScreen() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingRequest, setProcessingRequest] =
    useState<ProcessingRequest | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setErrorMessage("Trebuie să fii autentificat pentru a vedea cererile.");
      setIsLoading(false);
      return;
    }

    setErrorMessage("");

    try {
      const [incoming, outgoing] = await Promise.all([
        getIncomingFriendRequests(user.uid),
        getOutgoingFriendRequests(user.uid),
      ]);

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error("Nu am putut încărca cererile de prietenie:", error);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
  }

  async function processRequest(
    requestId: string,
    action: FriendRequestAction,
  ) {
    if (!user || processingRequest) {
      return;
    }

    setErrorMessage("");
    setProcessingRequest({ requestId, action });

    try {
      if (action === "accept") {
        await acceptFriendRequest(requestId, user.uid);
        setIncomingRequests((current) =>
          current.filter((request) => request.id !== requestId),
        );
      } else if (action === "decline") {
        await declineFriendRequest(requestId, user.uid);
        setIncomingRequests((current) =>
          current.filter((request) => request.id !== requestId),
        );
      } else {
        await cancelFriendRequest(requestId, user.uid);
        setOutgoingRequests((current) =>
          current.filter((request) => request.id !== requestId),
        );
      }
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setProcessingRequest(null);
    }
  }

  function getProcessingAction(
    requestId: string,
  ): FriendRequestAction | null {
    return processingRequest?.requestId === requestId
      ? processingRequest.action
      : null;
  }

  function confirmCancellation(requestId: string) {
    Alert.alert(
      "Anulezi cererea?",
      "Cererea trimisă va fi ștearsă.",
      [
        { text: "Înapoi", style: "cancel" },
        {
          text: "Anulează cererea",
          style: "destructive",
          onPress: () => {
            void processRequest(requestId, "cancel");
          },
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centeredState}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.stateText}>Se încarcă cererile...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              colors={[COLORS.primary]}
              onRefresh={() => {
                void handleRefresh();
              }}
              refreshing={isRefreshing}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons
                  color={COLORS.primary}
                  name="people-outline"
                  size={26}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Cereri de prietenie</Text>
                <Text style={styles.subtitle}>
                  Gestionează cererile primite și trimise.
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons
                  color={COLORS.error}
                  name="alert-circle-outline"
                  size={20}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable
                  accessibilityLabel="Reîncearcă încărcarea cererilor"
                  accessibilityRole="button"
                  onPress={() => {
                    setIsLoading(true);
                    void loadRequests();
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Reîncearcă</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Primite</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{incomingRequests.length}</Text>
                </View>
              </View>

              {incomingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    color={COLORS.textSecondary}
                    name="mail-open-outline"
                    size={28}
                  />
                  <Text style={styles.emptyTitle}>Nicio cerere primită</Text>
                  <Text style={styles.emptyText}>
                    Cererile noi vor apărea aici.
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {incomingRequests.map((request) => (
                    <FriendRequestCard
                      direction="incoming"
                      key={request.id}
                      onAccept={(requestId) => {
                        void processRequest(requestId, "accept");
                      }}
                      onDecline={(requestId) => {
                        void processRequest(requestId, "decline");
                      }}
                      processingAction={getProcessingAction(request.id)}
                      request={request}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trimise</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{outgoingRequests.length}</Text>
                </View>
              </View>

              {outgoingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    color={COLORS.textSecondary}
                    name="paper-plane-outline"
                    size={28}
                  />
                  <Text style={styles.emptyTitle}>Nicio cerere trimisă</Text>
                  <Text style={styles.emptyText}>
                    Cererile în așteptare vor apărea aici.
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {outgoingRequests.map((request) => (
                    <FriendRequestCard
                      direction="outgoing"
                      key={request.id}
                      onCancel={confirmCancellation}
                      processingAction={getProcessingAction(request.id)}
                      request={request}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 20,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  headerIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    backgroundColor: COLORS.errorBackground,
    borderColor: COLORS.error,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  retryText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "800",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 13,
  },
  countText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  cardList: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    gap: 5,
    padding: 24,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
  },
  emptyTitle: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
});
