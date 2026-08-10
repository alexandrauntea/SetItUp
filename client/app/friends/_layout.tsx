import { Stack } from "expo-router";

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ title: "Prieteni" }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ title: "Caută prieteni" }} 
      />
      <Stack.Screen 
        name="requests" 
        options={{ title: "Cereri de prietenie" }} 
      />
      <Stack.Screen 
        name="manager" 
        options={{ title: "Manager" }} 
      />
    </Stack>
  );
}
