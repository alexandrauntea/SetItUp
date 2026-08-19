import { AppButton } from "@/components/AppButton";
import { MatchCard } from "@/components/matches/MatchCard";
import { ScreenBackground } from "@/components/ScreenBackground";
import { PageBanner } from "@/components/PageBanner";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { listMatches } from "@/services/feed/matchService";
import { getManagedProfiles } from "@/services/social/managerService";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { Match } from "@/types/feed";
import type { ManagerRelationship, PublicProfile } from "@/types/social";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MatchListItem = {
  match: Match;
  profileId: string;
  profile: PublicProfile | null;
};

function getMatchedProfileId(match: Match, ownerId: string): string {
  const profileId = match.memberIds.find((memberId) => memberId !== ownerId);
  if (!profileId) {
    throw new Error("INVALID_MATCH_DATA");
  }

  return profileId;
}

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const requestSequence = useRef(0);
  const navigationLocked = useRef(false);
  const [managedOwner, setManagedOwner] = useState<ManagerRelationship | null>(
    null,
  );
  const [items, setItems] = useState<MatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [openingProfileId, setOpeningProfileId] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setIsLoading(true);
    setHasError(false);

    try {
      if (!user?.uid) {
        throw new Error("AUTH_REQUIRED");
      }

      const managedProfiles = await getManagedProfiles(user.uid);
      const ownerRelationship = managedProfiles[0] ?? null;
      if (!ownerRelationship) {
        if (requestId === requestSequence.current) {
          setManagedOwner(null);
          setItems([]);
        }
        return;
      }

      const matches = await listMatches(ownerRelationship.ownerId);
      const loadedItems = await Promise.all(
        matches.map(async (match) => {
          const profileId = getMatchedProfileId(
            match,
            ownerRelationship.ownerId,
          );
          const profile = await getPublicProfileByUid(profileId);

          return { match, profileId, profile } satisfies MatchListItem;
        }),
      );

      if (requestId === requestSequence.current) {
        setManagedOwner(ownerRelationship);
        setItems(loadedItems);
      }
    } catch (error) {
      console.info("Nu am putut încărca match-urile:", error);
      if (requestId === requestSequence.current) {
        setHasError(true);
        setItems([]);
      }
    } finally {
      if (requestId === requestSequence.current) {
        setIsLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadMatches();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadMatches]);

  function handleOpenProfile(profileId: string) {
    if (navigationLocked.current) {
      return;
    }

    navigationLocked.current = true;
    setOpeningProfileId(profileId);
    router.push({
      pathname: "/users/[uid]",
      params: { uid: profileId },
    });

    setTimeout(() => {
      navigationLocked.current = false;
      setOpeningProfileId(null);
    }, 0);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isCompact && styles.containerCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <PageBanner
              title="Match-uri"
              subtitle={managedOwner ? `Pentru @${managedOwner.ownerUsername}` : undefined}
            />

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.stateTitle}>Se încarcă match-urile...</Text>
              </View>
            ) : hasError ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIcon}>
                  <Ionicons
                    color={COLORS.error}
                    name="alert-circle-outline"
                    size={36}
                  />
                </View>
                <Text style={styles.stateTitle}>
                  Nu am putut încărca match-urile
                </Text>
                <Text style={styles.description}>
                  Verifică legătura la internet și încearcă din nou.
                </Text>
                <AppButton
                  onPress={() => void loadMatches()}
                  title="Încearcă din nou"
                />
              </View>
            ) : !managedOwner ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIcon}>
                  <Ionicons
                    color={COLORS.primary}
                    name="shield-outline"
                    size={36}
                  />
                </View>
                <Text style={styles.stateTitle}>
                  Disponibil numai managerului
                </Text>
                <Text style={styles.description}>
                  Lista Match-uri este folosită de manager în numele ownerului.
                </Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIcon}>
                  <Ionicons
                    color={COLORS.primary}
                    name="heart-outline"
                    size={36}
                  />
                </View>
                <Text style={styles.stateTitle}>Niciun match încă</Text>
                <Text style={styles.description}>
                  Continuă să descoperi profiluri. Match-urile reciproce vor
                  apărea aici.
                </Text>
              </View>
            ) : (
              <View style={styles.matchesList}>
                <Text style={styles.sectionTitle}>
                  {items.length} {items.length === 1 ? "match" : "match-uri"}
                </Text>
                {items.map(({ match, profile, profileId }) => (
                  <MatchCard
                    createdAt={match.createdAt}
                    key={match.id}
                    onOpenProfile={() => handleOpenProfile(profileId)}
                    opening={openingProfileId === profileId}
                    profile={profile}
                  />
                ))}
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
  container: { flexGrow: 1, padding: 20, paddingBottom: 120 },
  containerCompact: { paddingHorizontal: 14 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 22 },
  matchesList: { gap: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "800" },
  stateCard: {
    alignItems: "center",
    gap: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  stateIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
  },
  stateTitle: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
});
