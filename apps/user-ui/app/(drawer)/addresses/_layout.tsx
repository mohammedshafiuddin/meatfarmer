import { Stack } from 'expo-router';

export default function AddressesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Addresses',
          headerShown: false,
        }}
      />
    </Stack>
  );
}