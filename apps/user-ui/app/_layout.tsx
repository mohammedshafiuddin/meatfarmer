import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { theme } from "common-ui";
import queryClient from "@/utils/queryClient";
import Toast from "react-native-toast-message";
import { NotificationProvider } from "@/services/notif-service/notif-context";
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from "@/src/contexts/AuthContext";
import { trpc, trpcClient } from "@/src/trpc-client";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.gray1 }}>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <PaperProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </PaperProvider>
            </NotificationProvider>
          </AuthProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </View>
      <Toast />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}