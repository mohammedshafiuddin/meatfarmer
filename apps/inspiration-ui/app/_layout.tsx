import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack , usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/utils/queryClient";
import { AuthProvider } from "@/components/context/auth-context";
import Toast from "react-native-toast-message";
import { NotificationProvider } from "@/services/notif-service/notif-context";
import { Provider as PaperProvider } from 'react-native-paper';
// import {
//   NotificationContext,
//   NotificationProvider,
// } from "@/services/notif-service/notif-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PaperProvider>

            <AuthProvider>

              <Stack screenOptions={{ headerShown: false }} />
            </AuthProvider>
            </PaperProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </View>
      <Toast />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
