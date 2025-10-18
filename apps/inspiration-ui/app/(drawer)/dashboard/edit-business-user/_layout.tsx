import { Stack } from 'expo-router';
import React from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import useHideDrawerHeader from '@/hooks/useHideDrawerHeader';

export default function EditBusinessUserLayout() {
  const backgroundColor = useThemeColor({ light: '#f9fafb', dark: '#111827' }, 'background');
  const headerColor = useThemeColor({ light: '#fff', dark: '#1f2937' }, 'background');
  const textColor = useThemeColor({ light: '#111827', dark: '#f9fafb' }, 'text');
  
  useHideDrawerHeader();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: headerColor,
        },
        headerTintColor: textColor,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: "Edit User",
          headerBackTitle: "Dashboard",
        }}
      />
    </Stack>
  );
}
