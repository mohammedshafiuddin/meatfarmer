import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../utils/queryClient';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false}} />
    </QueryClientProvider>
  );
}