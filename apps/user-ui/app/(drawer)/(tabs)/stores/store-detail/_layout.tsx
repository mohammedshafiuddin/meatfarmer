import { Stack } from 'expo-router';

export default function StoreDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Store Details",
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen options={{headerShown: false}} name="product-detail" />
    </Stack>
  );
}