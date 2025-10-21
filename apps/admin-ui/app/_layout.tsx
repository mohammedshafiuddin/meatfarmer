import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../utils/queryClient';
import { Stack } from 'expo-router';
import { StaffAuthProvider } from '@/components/context/staff-auth-context';

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StaffAuthProvider>
        <Stack screenOptions={{ headerShown: false}} />
      </StaffAuthProvider>
    </QueryClientProvider>
  );
}