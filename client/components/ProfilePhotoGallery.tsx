import { COLORS } from "@/constants/colors";
import { getPhotoDownloadUrl } from "@/services/photoStorageService";
import { MAX_PROFILE_PHOTOS } from "@/types/photo";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ProfilePhotoGalleryProps {
  name: string;
  photoPaths?: string[];
  primaryPhotoPath?: string;
  primaryPhotoUrl?: string;
}

interface GalleryPhoto {
  storagePath: string;
  uri: string;
  isPrimary: boolean;
}

function getOrderedPaths(
  photoPaths: string[] | undefined,
  primaryPhotoPath: string | undefined,
): string[] {
  const uniquePaths = Array.from(
    new Set((photoPaths ?? []).filter((path) => path.trim().length > 0)),
  ).slice(0, MAX_PROFILE_PHOTOS);

  if (!primaryPhotoPath || !uniquePaths.includes(primaryPhotoPath)) {
    return uniquePaths;
  }

  return [
    primaryPhotoPath,
    ...uniquePaths.filter((path) => path !== primaryPhotoPath),
  ];
}

export function ProfilePhotoGallery({
  name,
  photoPaths,
  primaryPhotoPath,
  primaryPhotoUrl,
}: ProfilePhotoGalleryProps) {
  const orderedPaths = useMemo(
    () => getOrderedPaths(photoPaths, primaryPhotoPath),
    [photoPaths, primaryPhotoPath],
  );
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (orderedPaths.length < 2) {
      setPhotos([]);
      setSelectedPath(undefined);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);

    void Promise.all(
      orderedPaths.map(async (storagePath) => {
        try {
          const uri =
            storagePath === primaryPhotoPath && primaryPhotoUrl
              ? primaryPhotoUrl
              : await getPhotoDownloadUrl(storagePath);

          return {
            storagePath,
            uri,
            isPrimary: storagePath === primaryPhotoPath,
          } satisfies GalleryPhoto;
        } catch {
          return null;
        }
      }),
    ).then((resolvedPhotos) => {
      if (!isActive) return;

      const availablePhotos = resolvedPhotos.filter(
        (photo): photo is GalleryPhoto => photo !== null,
      );
      setPhotos(availablePhotos);
      setSelectedPath((currentPath) =>
        availablePhotos.some((photo) => photo.storagePath === currentPath)
          ? currentPath
          : availablePhotos[0]?.storagePath,
      );
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [orderedPaths, primaryPhotoPath, primaryPhotoUrl]);

  if (orderedPaths.length < 2) return null;

  const selectedIndex = Math.max(
    0,
    photos.findIndex((photo) => photo.storagePath === selectedPath),
  );
  const selectedPhoto = photos[selectedIndex];

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Fotografii</Text>
        {!isLoading && photos.length > 0 ? (
          <Text style={styles.counter}>
            {selectedIndex + 1} din {photos.length}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            accessibilityLabel="Se încarcă fotografiile"
            accessibilityRole="progressbar"
            color={COLORS.primary}
          />
        </View>
      ) : selectedPhoto ? (
        <>
          <View style={styles.previewContainer}>
            <Image
              accessibilityLabel={`Fotografia ${selectedIndex + 1} din ${photos.length} a profilului ${name}`}
              contentFit="cover"
              source={{ uri: selectedPhoto.uri }}
              style={styles.preview}
              transition={150}
            />
            {selectedPhoto.isPrimary ? (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Principală</Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.thumbnailList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {photos.map((photo, index) => {
              const isSelected = photo.storagePath === selectedPhoto.storagePath;

              return (
                <Pressable
                  accessibilityLabel={`Afișează fotografia ${index + 1}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={photo.storagePath}
                  onPress={() => setSelectedPath(photo.storagePath)}
                  style={({ pressed }) => [
                    styles.thumbnailButton,
                    isSelected && styles.thumbnailButtonSelected,
                    pressed && styles.thumbnailButtonPressed,
                  ]}
                >
                  <Image
                    accessibilityIgnoresInvertColors
                    contentFit="cover"
                    source={{ uri: photo.uri }}
                    style={styles.thumbnail}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.errorText}>
          Fotografiile nu au putut fi încărcate.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "700",
  },
  counter: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  previewContainer: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  primaryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(26, 26, 26, 0.78)",
  },
  primaryBadgeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "700",
  },
  thumbnailList: {
    gap: 10,
    paddingVertical: 2,
  },
  thumbnailButton: {
    overflow: "hidden",
    width: 68,
    height: 68,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 14,
  },
  thumbnailButtonSelected: {
    borderColor: COLORS.primary,
  },
  thumbnailButtonPressed: {
    opacity: 0.72,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  errorText: {
    paddingVertical: 24,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 15,
  },
});
