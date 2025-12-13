import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Dimensions, View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { theme } from "common-ui";
import queryClient from "@/utils/queryClient";
import Toast from "react-native-toast-message";
import { NotificationProvider } from "@/services/notif-service/notif-context";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { trpc, trpcClient } from "@/src/trpc-client";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationTestWrapper from "@/components/LocationTestWrapper";
import HealthTestWrapper from "@/components/HealthTestWrapper";
import FirstUserWrapper from "@/components/FirstUserWrapper";
import { RefreshProvider } from '../../../packages/ui/src/lib/refresh-context';

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
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: theme.colors.gray1 }}>
          <QueryClientProvider client={queryClient}>
              <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <HealthTestWrapper>
                  <FirstUserWrapper>
                    <AuthProvider>
                   <NotificationProvider>
                     <PaperProvider>
                        <LocationTestWrapper>
                          <RefreshProvider queryClient={queryClient}>
                            <Stack screenOptions={{ headerShown: false }} />
                          </RefreshProvider>
                        </LocationTestWrapper>
                     </PaperProvider>
                    </NotificationProvider>
                  </AuthProvider>
                  </FirstUserWrapper>
                </HealthTestWrapper>
              </trpc.Provider>
          </QueryClientProvider>
        </View>
      </SafeAreaView>
      <Toast />
    </ThemeProvider>
  );
}
