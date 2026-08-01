import { COLORS } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 64 }: BrandLogoProps) {
  return (
    <View
      accessibilityLabel="SetItUp"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
        },
      ]}
    >
      <Text
        style={[
          styles.symbol,
          {
            fontSize: size * 0.62,
            lineHeight: size * 0.68,
          },
        ]}
      >
        ∞
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  symbol: {
    color: COLORS.background,
    fontWeight: "600",
    textAlign: "center",
    transform: [{ scaleX: 1.35 }],
  },
});
