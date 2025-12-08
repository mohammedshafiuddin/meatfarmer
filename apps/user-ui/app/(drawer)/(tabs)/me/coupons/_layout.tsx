import { Stack } from 'expo-router';

export default function CouponsLayout() {
  return (
    <Stack>
       <Stack.Screen
         name="index"
         options={{
           title: 'My Coupons',
           headerShown: true,
         }}
       />
    </Stack>
  );
}