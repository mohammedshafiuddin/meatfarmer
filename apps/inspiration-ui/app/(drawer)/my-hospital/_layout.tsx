import { Stack } from 'expo-router';
import React from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MyHospitalLayout() {
  const backgroundColor = useThemeColor({ light: '#f9fafb', dark: '#111827' }, 'background');
  const headerColor = useThemeColor({ light: '#fff', dark: '#1f2937' }, 'background');
  const textColor = useThemeColor({ light: '#111827', dark: '#f9fafb' }, 'text');
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "My Hospital",
        }}
      />
      <Stack.Screen
        name="add-doctor"
        options={{
          title: "Add Doctor",
        }}
      />
    </Stack>
  );
}
