import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SetItUp</Text>
      <Text>Fresh start</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
});
