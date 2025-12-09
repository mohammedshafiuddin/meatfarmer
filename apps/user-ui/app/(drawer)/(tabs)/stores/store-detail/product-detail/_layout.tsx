import { Stack } from 'expo-router';

export default function ProductDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Product Details",
      }}
    />
  );
}