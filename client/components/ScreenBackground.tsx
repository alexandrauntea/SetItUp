import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type ScreenBackgroundProps = {
  children: ReactNode;
};

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primarySoft, COLORS.background, COLORS.canvas]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.circle, styles.topCircle]} />
        <View style={[styles.circle, styles.sideCircle]} />
        <View style={[styles.circle, styles.bottomCircle]} />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  topCircle: {
    top: -110,
    right: -85,
    width: 260,
    height: 260,
    backgroundColor: "rgba(230, 0, 0, 0.06)",
  },
  sideCircle: {
    top: "38%",
    left: -70,
    width: 150,
    height: 150,
    borderWidth: 24,
    borderColor: "rgba(230, 0, 0, 0.035)",
  },
  bottomCircle: {
    bottom: -130,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: "rgba(216, 216, 216, 0.3)",
  },
});
