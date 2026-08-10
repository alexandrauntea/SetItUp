import { ManagerCard } from "@/components/social/ManagerCard";
import { useAuth } from "@/contexts/AuthContext";
import { getFriends } from "@/services/social/friendshipService";
import {
  acceptManagerRequest,
  declineManagerRequest,
  getIncomingManagerRequests,
  getManagerRelationship,
  getOutgoingManagerRequests,
  removeManager,
  sendManagerRequest,
} from "@/services/social/managerService";
import { Friendship, ManagerRelationship, ManagerRequest } from "@/types/social";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerScreen() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [activeManager, setActiveManager] = useState<ManagerRelationship | null>(
    null
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
    if (!uid) return;
    setErrorMessage(null);

    try {
      const [managerRel, incoming, outgoing, friendList] = await Promise.all([
        getManagerRelationship(uid),
        getIncomingManagerRequests(uid),
        getOutgoingManagerRequests(uid),
        getFriends(uid),
      ]);

      setActiveManager(managerRel);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setFriends(friendList);
    } catch (error: any) {
      console.error("Error loading manager data:", error);
      setErrorMessage("A apărut o eroare la încărcarea datelor.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      Alert.alert(
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
      Alert.alert("Eroare", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!uid) return;

    setActionLoadingId(requestId);
    try {
      await acceptManagerRequest(requestId, uid);
      Alert.alert("Succes", "Ai acceptat rolul de manager.");
      await loadData();
    } catch (error: any) {
      console.error("Error accepting manager request:", error);
      Alert.alert("Eroare", "Nu s-a putut accepta cererea.");
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

    Alert.alert(
      "Confirmare",
      `Sigur dorești să ${actionText} această cerere de manager?`,
      [
        { text: "Nu", style: "cancel" },
        {
          text: "Da",
          style: "destructive",
          onPress: async () => {
            setActionLoadingId(requestId);
            try {
              await declineManagerRequest(requestId, uid);
              await loadData();
            } catch (error: any) {
              console.error("Error declining/canceling request:", error);
              Alert.alert("Eroare", "A apărut o problemă la procesarea cererii.");
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRemoveManager = async () => {
    if (!uid || !activeManager) return;

    Alert.alert(
      "Confirmare",
      "Sigur dorești să elimini relația de manager?",
      [
        { text: "Nu", style: "cancel" },
        {
          text: "Da, elimină",
          style: "destructive",
          onPress: async () => {
            setActionLoadingId("remove-manager");
            try {
              await removeManager(activeManager.ownerId, uid);
              Alert.alert("Succes", "Relația de manager a fost eliminată.");
              await loadData();
            } catch (error: any) {
              console.error("Error removing manager:", error);
              Alert.alert("Eroare", "Nu s-a putut elimina managerul.");
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7000FF" />
        <Text style={styles.loadingText}>Se încarcă datele de manager...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#7000FF"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gestionare Manager</Text>
        <Text style={styles.subtitle}>
          Setează un prieten drept manager pentru a-i oferi acces la profilul și activitatea ta.
        </Text>
      </View>

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
            onRemove={handleRemoveManager}
            loading={actionLoadingId === "remove-manager"}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nu ai niciun manager desemnat în acest moment.
            </Text>
          </View>
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
                    <ActivityIndicator size="small" color="#FFFFFF" />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12121A",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#12121A",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#A0A0B2",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#A0A0B2",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: "rgba(255, 77, 77, 0.15)",
    borderWidth: 1,
    borderColor: "#FF4D4D",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF4D4D",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: "#1E1E2D",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2C3E",
  },
  emptyText: {
    color: "#A0A0B2",
    fontSize: 14,
    textAlign: "center",
  },
  proposalCard: {
    backgroundColor: "#1E1E2D",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C3E",
  },
  proposalLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  friendsPickerScroll: {
    flexDirection: "row",
    marginBottom: 14,
  },
  friendChip: {
    backgroundColor: "#2C2C3E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#3A3A52",
  },
  friendChipSelected: {
    backgroundColor: "#7000FF",
    borderColor: "#7000FF",
  },
  friendChipText: {
    color: "#A0A0B2",
    fontSize: 14,
    fontWeight: "500",
  },
  friendChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#7000FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
