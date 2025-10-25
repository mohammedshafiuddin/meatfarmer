import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "../utils/queryClient";
import { Stack } from "expo-router";
import { StaffAuthProvider } from "@/components/context/staff-auth-context";
import { trpc, trpcClient } from "@/src/trpc-client";

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <StaffAuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </StaffAuthProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
