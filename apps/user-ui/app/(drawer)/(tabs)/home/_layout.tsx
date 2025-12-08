import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="product-detail/[id]"
        options={{
          headerShown: true,
          title: "Product Details",
        }}
      />
    </Stack>
  );
}