import { AppButton } from "@/components/AppButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { PageBanner } from "@/components/PageBanner";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedFilterModal } from "@/components/feed/FeedFilterModal";
import { MatchModal } from "@/components/feed/MatchModal";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { getFeed } from "@/services/feed/feedService";
import { saveReaction } from "@/services/feed/reactionService";
import { getManagedProfiles } from "@/services/social/managerService";
import {
  FeedCandidateProfile,
  FeedFilterPreferences,
  FeedItem,
  FeedPreferences,
} from "@/types/feed";
import { ManagerRelationship } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function buildPreferences(
  ownerId: string,
  selectedFilters: FeedFilterPreferences,
): FeedPreferences {
  return {
    ownerId,
    minAge: selectedFilters.minAge ?? 18,
    maxAge: selectedFilters.maxAge ?? 100,
    genders:
      selectedFilters.gender && selectedFilters.gender !== "any"
        ? [selectedFilters.gender]
        : [],
    interests: selectedFilters.interests ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function FeedScreen() {
  const { user } = useAuth();
  const [managerRel, setManagerRel] = useState<ManagerRelationship | null>(null);
  const [isManagerChecked, setIsManagerChecked] = useState<boolean>(false);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FeedFilterPreferences>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  const [actionLoading, setActionLoading] = useState<"like" | "dislike" | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState<boolean>(false);
  const [matchedProfile, setMatchedProfile] = useState<FeedCandidateProfile | undefined>();

  const fetchFeed = useCallback(
    async (targetFilters?: FeedFilterPreferences) => {
      if (!user?.uid) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const rel = (await getManagedProfiles(user.uid))[0] ?? null;
        setManagerRel(rel);
        setIsManagerChecked(true);

        if (!rel) {
          setIsLoading(false);
          return;
        }

        const page = await getFeed({
          ownerId: rel.ownerId,
          actorId: user.uid,
          preferences: buildPreferences(
            rel.ownerId,
            targetFilters ?? filters,
          ),
        });
        setFeedItems(
          page.profiles.map((profile) => ({
            profile,
            commonFriendsCount: profile.mutualFriendsCount,
            isPreferred: profile.matchesPreferences,
          })),
        );
        setCurrentIndex(0);
      } catch (err: any) {
        console.error("Error fetching feed:", err);
        setErrorMessage(
          err.message === "NOT_A_MANAGER"
            ? "Nu ești manager pentru niciun utilizator."
            : "Nu am putut încărca profilurile din feed. Verifică conexiunea și încearcă din nou."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, filters]
  );

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  const currentItem = feedItems[currentIndex];

  async function handleLike() {
    if (!user?.uid || !currentItem || actionLoading) return;
    setActionLoading("like");

    try {
      if (!managerRel) return;
      const result = await saveReaction({
        ownerId: managerRel.ownerId,
        actorId: user.uid,
        targetId: currentItem.profile.uid,
        value: "like",
      });
      if (result.match) {
        setMatchedProfile(currentItem.profile);
        setMatchModalVisible(true);
      }
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Error liking profile:", err);
      setErrorMessage("A apărut o eroare la salvarea aprecierii. Încearcă din nou.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDislike() {
    if (!user?.uid || !currentItem || actionLoading) return;
    setActionLoading("dislike");

    try {
      if (!managerRel) return;
      await saveReaction({
        ownerId: managerRel.ownerId,
        actorId: user.uid,
        targetId: currentItem.profile.uid,
        value: "dislike",
      });
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Error disliking profile:", err);
      setErrorMessage("A apărut o eroare la trimiterea dislike-ului.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleApplyFilters(newFilters: FeedFilterPreferences) {
    setFilters(newFilters);
    void fetchFeed(newFilters);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Header */}
          <PageBanner
            title="Feed Potriviri"
            subtitle={managerRel ? `Căuți match-uri pentru @${managerRel.ownerUsername}` : undefined}
            action={managerRel ? (
              <TouchableOpacity
                accessibilityLabel="Filtre"
                accessibilityRole="button"
                onPress={() => setIsFilterModalOpen(true)}
                style={styles.filterButton}
                testID="feed-filter-trigger"
              >
                <Ionicons name="options-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            ) : undefined}
          />

          {/* Main Content Area */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Loading State */}
            {isLoading && (
              <View style={styles.centerCard} testID="feed-loading-container">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Se încarcă profilurile...</Text>
              </View>
            )}

            {/* 2. Error State with Retry */}
            {!isLoading && errorMessage && (
              <View style={styles.errorCard} testID="feed-error-container">
                <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                <Text style={styles.errorTitle}>A apărut o eroare</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <AppButton
                  title="Încearcă din nou"
                  onPress={() => void fetchFeed()}
                  testID="feed-retry-button"
                />
              </View>
            )}

            {/* 3. Non-Manager State */}
            {!isLoading && !errorMessage && isManagerChecked && !managerRel && (
              <View style={styles.emptyCard} testID="feed-not-manager-container">
                <Ionicons name="shield-outline" size={56} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>Doar pentru manageri</Text>
                <Text style={styles.emptyDescription}>
                  Momentan nu ești manager pentru niciun utilizator. Un owner trebuie să te desemneze drept manager pentru a accesa feedul.
                </Text>
              </View>
            )}

            {/* 4. Empty Feed State */}
            {!isLoading &&
              !errorMessage &&
              managerRel &&
              (currentIndex >= feedItems.length || feedItems.length === 0) && (
                <View style={styles.emptyCard} testID="feed-empty-container">
                  <Ionicons name="sparkles-outline" size={56} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>Nu mai sunt profiluri</Text>
                  <Text style={styles.emptyDescription}>
                    Ai parcurs toate profilurile disponibile. Revino mai târziu sau modifică filtrele pentru a găsi alte opțiuni!
                  </Text>
                  <AppButton
                    title="Reîmprospătează feedul"
                    onPress={() => void fetchFeed()}
                    variant="outline"
                    testID="feed-refresh-button"
                  />
                </View>
              )}

            {/* 5. Active Profile Card Deck */}
            {!isLoading &&
              !errorMessage &&
              managerRel &&
              currentItem && (
                <View style={styles.cardWrapper} testID="feed-card-wrapper">
                  <FeedCard
                    item={currentItem}
                    loadingAction={actionLoading}
                    onDislike={() => void handleDislike()}
                    onLike={() => void handleLike()}
                  />
                </View>
              )}
          </ScrollView>
        </View>

        {/* Este Match! Modal */}
        <MatchModal
          visible={matchModalVisible}
          matchedProfile={matchedProfile}
          ownerUsername={managerRel?.ownerUsername}
          onClose={() => {
            setMatchModalVisible(false);
            setMatchedProfile(undefined);
          }}
        />

        {/* Filter Modal */}
        <FeedFilterModal
          visible={isFilterModalOpen}
          initialFilters={filters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 110,
    paddingTop: 22,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 440,
  },
  centerCard: {
    width: "100%",
    maxWidth: 430,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  errorCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.background,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.errorBackground,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.background,
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
