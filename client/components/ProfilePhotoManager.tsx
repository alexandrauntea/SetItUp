import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/constants/colors";
import type { ProfilePhoto } from "@/types/photo";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import { requestConfirmation } from "@/utils/platformAlert";
import {
  selectProfilePhotoFromLibrary,
  type SelectedProfilePhoto,
} from "@/utils/profilePhotoSelection";

export type ProfilePhotoOperation = {
  kind: "upload" | "replace" | "delete" | "set-primary";
  photoId?: string;
  progress?: number;
};

export type ProfilePhotoPreview = ProfilePhoto & {
  previewUri: string;
};

type ProfilePhotoManagerProps = {
  initials: string;
  photos: ProfilePhotoPreview[];
  operation?: ProfilePhotoOperation | null;
  errorMessage?: string;
  disabled?: boolean;
  onAddPhoto: (photo: SelectedProfilePhoto) => Promise<void> | void;
  onReplacePhoto: (
    photoId: string,
    photo: SelectedProfilePhoto,
  ) => Promise<void> | void;
  onRemovePhoto: (photoId: string) => Promise<void> | void;
  onSetPrimaryPhoto: (photoId: string) => Promise<void> | void;
};

function operationLabel(operation: ProfilePhotoOperation) {
  switch (operation.kind) {
    case "upload":
      return "Se încarcă fotografia";
    case "replace":
      return "Se înlocuiește fotografia";
    case "delete":
      return "Se elimină fotografia";
    case "set-primary":
      return "Se actualizează fotografia principală";
  }
}

export function ProfilePhotoManager({
  initials,
  photos,
  operation = null,
  errorMessage = "",
  disabled = false,
  onAddPhoto,
  onReplacePhoto,
  onRemovePhoto,
  onSetPrimaryPhoto,
}: ProfilePhotoManagerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [localError, setLocalError] = useState("");
  const sortedPhotos = useMemo(
    () => [...photos].sort((first, second) => first.position - second.position),
    [photos],
  );
  const isBusy = disabled || isSelecting || operation !== null;

  async function runAction(
    action: () => Promise<void> | void,
    fallbackMessage: string,
  ) {
    setLocalError("");

    try {
      await action();
    } catch (error) {
      console.info("Fotografiile profilului nu au putut fi actualizate:", error);
      setLocalError(getFirebaseErrorMessage(error, fallbackMessage));
    }
  }

  async function choosePhoto(
    onSelected: (photo: SelectedProfilePhoto) => Promise<void> | void,
    fallbackMessage: string,
  ) {
    setIsSelecting(true);
    setLocalError("");

    try {
      const selection = await selectProfilePhotoFromLibrary();

      if (selection.status === "error") {
        setLocalError(`${selection.title}. ${selection.message}`);
        return;
      }

      if (selection.status === "selected") {
        await runAction(() => onSelected(selection.photo), fallbackMessage);
      }
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleRemove(photoId: string) {
    const confirmed = await requestConfirmation({
      title: "Elimini fotografia?",
      message:
        "Fotografia va fi ștearsă din profil și nu va mai putea fi recuperată.",
      cancelText: "Anulează",
      confirmText: "Elimină",
      destructive: true,
    });

    if (!confirmed) return;

    await runAction(
      () => onRemovePhoto(photoId),
      "Fotografia nu a putut fi eliminată. Încearcă din nou.",
    );
  }

  const progress = operation?.progress;
  const normalizedProgress =
    progress === undefined ? undefined : Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>Fotografiile profilului</Text>
        <Text style={styles.helperText}>
          Alege imagini JPG, PNG sau WebP de maximum 5 MB. Fotografia
          principală apare prima în profil.
        </Text>
      </View>

      {sortedPhotos.length > 0 ? (
        <View style={styles.photoGrid}>
          {sortedPhotos.map((photo) => {
            const isPhotoBusy =
              operation?.photoId === photo.id ||
              (operation?.kind === "set-primary" && !operation.photoId);

            return (
              <View key={photo.id} style={styles.photoCard}>
                <View style={styles.previewContainer}>
                  {photo.previewUri ? (
                    <Image
                      accessibilityLabel={
                        photo.isPrimary
                          ? "Fotografia principală a profilului"
                          : `Fotografia ${photo.position + 1} a profilului`
                      }
                      source={{ uri: photo.previewUri }}
                      contentFit="cover"
                      style={styles.preview}
                    />
                  ) : (
                    <View style={styles.previewUnavailable}>
                      <Ionicons
                        name="image-outline"
                        size={30}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.previewUnavailableText}>
                        Previzualizare indisponibilă
                      </Text>
                    </View>
                  )}

                  {photo.isPrimary ? (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={13} color={COLORS.background} />
                      <Text style={styles.primaryBadgeText}>Principală</Text>
                    </View>
                  ) : null}

                  {isPhotoBusy ? (
                    <View style={styles.busyOverlay}>
                      <ActivityIndicator color={COLORS.background} />
                    </View>
                  ) : null}
                </View>

                <View style={styles.photoActions}>
                  {!photo.isPrimary ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() =>
                        void runAction(
                          () => onSetPrimaryPhoto(photo.id),
                          "Fotografia principală nu a putut fi schimbată.",
                        )
                      }
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                    >
                      <Ionicons name="star-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.actionText}>Setează principală</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Înlocuiește fotografia ${photo.position + 1}`}
                    disabled={isBusy}
                    onPress={() =>
                      void choosePhoto(
                        (selectedPhoto) =>
                          onReplacePhoto(photo.id, selectedPhoto),
                        "Fotografia nu a putut fi înlocuită. Încearcă din nou.",
                      )
                    }
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
                    <Text style={styles.actionText}>Înlocuiește</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Elimină fotografia ${photo.position + 1}`}
                    disabled={isBusy}
                    onPress={() => void handleRemove(photo.id)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.removeButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    <Text style={styles.removeText}>Elimină</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.initialsCircle}>
            <Text style={styles.initials}>{initials || "?"}</Text>
          </View>
          <Text style={styles.emptyTitle}>Nu ai adăugat încă fotografii</Text>
          <Text style={styles.emptyDescription}>
            Prima fotografie încărcată va deveni automat principală.
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adaugă o fotografie de profil"
        disabled={isBusy}
        onPress={() =>
          void choosePhoto(
            onAddPhoto,
            "Fotografia nu a putut fi încărcată. Încearcă din nou.",
          )
        }
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
          isBusy && styles.disabled,
        ]}
      >
        {isSelecting ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Ionicons name="add" size={20} color={COLORS.background} />
        )}
        <Text style={styles.addButtonText}>Adaugă fotografie</Text>
      </Pressable>

      {operation ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={
            normalizedProgress === undefined
              ? undefined
              : { min: 0, max: 100, now: Math.round(normalizedProgress) }
          }
          style={styles.operation}
        >
          <View style={styles.operationHeading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.operationText}>
              {operationLabel(operation)}
              {normalizedProgress === undefined
                ? "…"
                : `… ${Math.round(normalizedProgress)}%`}
            </Text>
          </View>

          {normalizedProgress !== undefined ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressValue,
                  { width: `${normalizedProgress}%` },
                ]}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {localError || errorMessage ? (
        <View accessibilityRole="alert" style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
          <Text style={styles.errorText}>{localError || errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heading: {
    gap: 5,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  photoGrid: {
    gap: 14,
  },
  photoCard: {
    overflow: "hidden",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
  },
  previewContainer: {
    width: "100%",
    aspectRatio: 1.35,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  previewUnavailableText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  primaryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  primaryBadgeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "700",
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 26, 26, 0.42)",
  },
  photoActions: {
    gap: 4,
    padding: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  actionButtonPressed: {
    backgroundColor: COLORS.primarySoft,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    marginTop: 2,
  },
  removeText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
  },
  initialsCircle: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 38,
  },
  initials: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "700",
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  addButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  addButtonPressed: {
    backgroundColor: COLORS.primaryPressed,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  operation: {
    gap: 9,
    padding: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
  },
  operationHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  operationText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    borderRadius: 999,
  },
  progressValue: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.errorBackground,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
