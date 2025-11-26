import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "../utils/queryClient";
import { Stack } from "expo-router";
import { StaffAuthProvider } from "@/components/context/staff-auth-context";
import { trpc, trpcClient } from "@/src/trpc-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { RefreshProvider } from '../../../packages/ui/src/lib/refresh-context';

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <StaffAuthProvider>
          <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: '#fff' }}>
          <RefreshProvider queryClient={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </RefreshProvider>
          </SafeAreaView>
        </StaffAuthProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
