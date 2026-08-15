import { ScreenBackground } from "@/components/ScreenBackground";
import { ManagerCard } from "@/components/social/ManagerCard";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { getFriends } from "@/services/social/friendshipService";
import {
  acceptManagerRequest,
  declineManagerRequest,
  getIncomingManagerRequests,
  getManagedProfiles,
  getManagerRelationship,
  getOutgoingManagerRequests,
  removeManager,
  sendManagerRequest,
} from "@/services/social/managerService";
import { Friendship, ManagerRelationship, ManagerRequest } from "@/types/social";
import { requestConfirmation, showPlatformAlert } from "@/utils/platformAlert";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/friends" as Href);
    }
  }
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [activeManager, setActiveManager] = useState<ManagerRelationship | null>(
    null
  );
  const [managedProfiles, setManagedProfiles] = useState<ManagerRelationship[]>(
    [],
  );
  const [incomingRequests, setIncomingRequests] = useState<ManagerRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ManagerRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<{
    uid: string;
    username: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setErrorMessage(null);

    const [
      managerRelResult,
      managedProfilesResult,
      incomingResult,
      outgoingResult,
      friendsResult,
    ] =
      await Promise.allSettled([
        getManagerRelationship(uid),
        getManagedProfiles(uid),
        getIncomingManagerRequests(uid),
        getOutgoingManagerRequests(uid),
        getFriends(uid),
      ]);

    if (managerRelResult.status === "fulfilled") {
      setActiveManager(managerRelResult.value);
    }
    if (managedProfilesResult.status === "fulfilled") {
      setManagedProfiles(managedProfilesResult.value);
    }
    if (incomingResult.status === "fulfilled") {
      setIncomingRequests(incomingResult.value);
    }
    if (outgoingResult.status === "fulfilled") {
      setOutgoingRequests(outgoingResult.value);
    }
    if (friendsResult.status === "fulfilled") {
      setFriends(friendsResult.value);
    }

    const rejectedResult = [
      managerRelResult,
      managedProfilesResult,
      incomingResult,
      outgoingResult,
      friendsResult,
    ].find((result) => result.status === "rejected");

    if (rejectedResult?.status === "rejected") {
      console.error("Error loading manager data:", rejectedResult.reason);
      setErrorMessage(
        "Unele date nu au putut fi încărcate. Trage în jos pentru a reîncerca."
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getFriendDetails = (friendship: Friendship) => {
    const isFirst = friendship.memberIds[0] === uid;
    const friendUid = isFirst ? friendship.memberIds[1] : friendship.memberIds[0];
    const friendUsername = isFirst
      ? friendship.memberUsernames[1]
      : friendship.memberUsernames[0];
    return { uid: friendUid, username: friendUsername };
  };

  const handleSendProposal = async () => {
    if (!uid || !selectedFriend) return;

    setActionLoadingId("send-proposal");
    setErrorMessage(null);

    try {
      await sendManagerRequest(uid, selectedFriend.uid);
      showPlatformAlert(
        "Succes",
        `Cererea de manager a fost trimisă către @${selectedFriend.username}.`
      );
      setSelectedFriend(null);
      await loadData();
    } catch (error: any) {
      console.error("Error sending manager request:", error);
      let msg = "Nu s-a putut trimite cererea.";
      if (error.message === "ALREADY_HAS_MANAGER") {
        msg = "Ai deja un manager activ sau definit.";
      } else if (error.message === "REQUEST_ALREADY_EXISTS") {
        msg = "Există deja o cerere trimisă către acest utilizator.";
      } else if (error.message === "NOT_FRIENDS") {
        msg = "Trebuie să fii prieten cu utilizatorul pentru a-l desemna manager.";
      }
      showPlatformAlert("Eroare", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!uid) return;

    setActionLoadingId(requestId);
    try {
      await acceptManagerRequest(requestId, uid);
      showPlatformAlert("Succes", "Ai acceptat rolul de manager.");
      await loadData();
    } catch (error: any) {
      console.error("Error accepting manager request:", error);
      showPlatformAlert("Eroare", "Nu s-a putut accepta cererea.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineOrCancelRequest = async (
    requestId: string,
    isCancel = false
  ) => {
    if (!uid) return;

    const actionText = isCancel ? "anulezi" : "refuzi";

    const confirmed = await requestConfirmation({
      title: "Confirmare",
      message: `Sigur dorești să ${actionText} această cerere de manager?`,
      cancelText: "Nu",
      confirmText: "Da",
      destructive: true,
    });

    if (!confirmed) return;

    setActionLoadingId(requestId);
    try {
      await declineManagerRequest(requestId, uid);
      await loadData();
    } catch (error: any) {
      console.error("Error declining/canceling request:", error);
      showPlatformAlert("Eroare", "A apărut o problemă la procesarea cererii.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveManager = async (relationship: ManagerRelationship) => {
    if (!uid) return;

    const confirmed = await requestConfirmation({
      title: "Confirmare",
      message: "Sigur dorești să elimini relația de manager?",
      cancelText: "Nu",
      confirmText: "Da, elimină",
      destructive: true,
    });

    if (!confirmed) return;

    const loadingId = `remove-manager-${relationship.ownerId}`;
    setActionLoadingId(loadingId);
    try {
      await removeManager(relationship.ownerId, uid);
      showPlatformAlert("Succes", "Relația de manager a fost eliminată.");
      await loadData();
    } catch (error: any) {
      console.error("Error removing manager:", error);
      showPlatformAlert("Eroare", "Nu s-a putut elimina managerul.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Se încarcă datele de manager...</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.content}>
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
              <Ionicons name="arrow-back" size={23} color={COLORS.text} />
            </Pressable>

            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryPressed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerCard}
            >
              <Text style={styles.title}>Gestionare Manager</Text>
              <Text style={styles.subtitle}>
                Setează un prieten drept manager pentru a-i oferi acces la profilul și activitatea ta.
              </Text>
            </LinearGradient>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* 1. Relație Activă */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Managerul Tău Activ</Text>
              {activeManager ? (
                <ManagerCard
                  username={activeManager.managerUsername}
                  type="active_as_owner"
                  onRemove={() => handleRemoveManager(activeManager)}
                  loading={
                    actionLoadingId === `remove-manager-${activeManager.ownerId}`
                  }
                />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nu ai niciun manager desemnat în acest moment.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Profiluri pentru care ești manager ({managedProfiles.length})
              </Text>
              {managedProfiles.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nu ești manager pentru niciun profil în acest moment.
                  </Text>
                </View>
              ) : (
                managedProfiles.map((relationship) => (
                  <ManagerCard
                    key={relationship.ownerId}
                    username={relationship.ownerUsername}
                    type="active_as_manager"
                    onRemove={() => handleRemoveManager(relationship)}
                    loading={
                      actionLoadingId ===
                      `remove-manager-${relationship.ownerId}`
                    }
                  />
                ))
              )}
            </View>

            {/* 2. Propune Prieten ca Manager */}
            {!activeManager && outgoingRequests.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Propune un Manager</Text>
                {friends.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      Trebuie să ai cel puțin un prieten în listă pentru a-l propune drept manager.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.proposalCard}>
                    <Text style={styles.proposalLabel}>
                      Alege un prieten din listă:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.friendsPickerScroll}
                    >
                      {friends.map((f) => {
                        const details = getFriendDetails(f);
                        const isSelected = selectedFriend?.uid === details.uid;
                        return (
                          <TouchableOpacity
                            key={f.id}
                            style={[
                              styles.friendChip,
                              isSelected && styles.friendChipSelected,
                            ]}
                            onPress={() => setSelectedFriend(details)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.friendChipText,
                                isSelected && styles.friendChipTextSelected,
                              ]}
                            >
                              @{details.username}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedFriend && (
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSendProposal}
                        disabled={actionLoadingId === "send-proposal"}
                        activeOpacity={0.8}
                      >
                        {actionLoadingId === "send-proposal" ? (
                          <ActivityIndicator size="small" color={COLORS.background} />
                        ) : (
                          <Text style={styles.submitButtonText}>
                            Trimite propunere către @{selectedFriend.username}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 3. Cereri Primite */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Cereri Primite ({incomingRequests.length})
              </Text>
              {incomingRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nu ai nicio cerere de manager primită.
                  </Text>
                </View>
              ) : (
                incomingRequests.map((req) => (
                  <ManagerCard
                    key={req.id}
                    username={req.ownerUsername}
                    subtitle="Te-a propus să îi fii manager"
                    type="incoming"
                    onAccept={() => handleAcceptRequest(req.id)}
                    onDecline={() => handleDeclineOrCancelRequest(req.id, false)}
                    loading={actionLoadingId === req.id}
                  />
                ))
              )}
            </View>

            {/* 4. Cereri Trimise */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Cereri Trimise ({outgoingRequests.length})
              </Text>
              {outgoingRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nu ai nicio cerere de manager în așteptare.
                  </Text>
                </View>
              ) : (
                outgoingRequests.map((req) => (
                  <ManagerCard
                    key={req.id}
                    username={req.managerUsername}
                    type="outgoing"
                    onCancel={() => handleDeclineOrCancelRequest(req.id, true)}
                    loading={actionLoadingId === req.id}
                  />
                ))
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
    flex: 1,
    backgroundColor: "transparent",
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    gap: 18,
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  headerCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primaryPressed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    color: COLORS.background,
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: COLORS.errorBackground,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  proposalCard: {
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  proposalLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  friendsPickerScroll: {
    flexDirection: "row",
    marginBottom: 14,
  },
  friendChip: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  friendChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  friendChipText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  friendChipTextSelected: {
    color: COLORS.background,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "600",
  },
});
