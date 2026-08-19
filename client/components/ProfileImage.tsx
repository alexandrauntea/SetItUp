import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { COLORS } from "@/constants/colors";

type ProfileImageProps = {
  uri?: string | null;
  name?: string;
  size?: number | "fill";
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function getInitials(name?: string): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

export function ProfileImage({
  uri,
  name,
  size = 60,
  borderRadius,
  style,
  testID,
}: ProfileImageProps) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);
  const fill = size === "fill";
  const radius = borderRadius ?? (fill ? 0 : size / 2);
  const initials = getInitials(name);

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(false);
  }, [uri]);

  const dimensions = fill
    ? styles.fill
    : { width: size, height: size };

  return (
    <View
      style={[styles.container, dimensions, { borderRadius: radius }, style]}
      testID={testID}
    >
      {uri && !failed ? (
        <Image
          accessibilityLabel={name ? `Fotografia lui ${name}` : "Fotografie de profil"}
          contentFit="cover"
          onError={() => {
            setFailed(true);
            setLoading(false);
          }}
          onLoad={() => setLoading(false)}
          onLoadStart={() => setLoading(true)}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          transition={150}
        />
      ) : initials ? (
        <Text style={[styles.initials, !fill && { fontSize: Math.max(16, size * 0.32) }]}>
          {initials}
        </Text>
      ) : (
        <Ionicons
          color={COLORS.primary}
          name="person"
          size={fill ? 72 : Math.max(22, size * 0.48)}
        />
      )}

      {loading && !failed ? (
        <View
          accessibilityLabel="Se încarcă fotografia de profil"
          accessibilityRole="progressbar"
          style={styles.loading}
        >
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
  fill: { width: "100%", height: "100%" },
  initials: { color: COLORS.primary, fontWeight: "800" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
});
