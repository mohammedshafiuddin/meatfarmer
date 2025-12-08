import { Stack } from "expo-router";

export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="checkout"
        options={{
          headerShown: true,
          title: "Checkout",
        }}
      />
      <Stack.Screen
        name="order-success"
        options={{
          headerShown: true,
          title: "Order Success",
        }}
      />
    </Stack>
  );
}