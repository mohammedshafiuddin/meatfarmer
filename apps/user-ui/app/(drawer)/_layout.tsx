import { Tabs } from "expo-router/tabs";
import { useRouter, Redirect } from "expo-router";
import {
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/src/contexts/AuthContext";
import { tw, theme } from "common-ui";
import { trpc } from "@/src/trpc-client";
import ProfileChecker from "@/components/ProfileChecker";

export default function Layout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Get cart data for badge
  const { data: cartData } = trpc.user.cart.getCart.useQuery();
  const cartItemCount = cartData?.totalItems || 0;

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color={theme.colors.pink2} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.pink2} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.pink1,
          tabBarInactiveTintColor: '#4B5563',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(tabs)/home"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(tabs)/cart"
          options={{
            tabBarLabel: 'Cart',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="shopping-cart" size={size} color={color} />
            ),
            tabBarBadge: cartItemCount > 0 ? (cartItemCount > 9 ? '9+' : cartItemCount.toString()) : undefined,
          }}
        />
        <Tabs.Screen
          name="(tabs)/me"
          options={{
            tabBarLabel: 'Me',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(tabs)/info"
          options={{
            tabBarLabel: 'Info',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="info" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <ProfileChecker />
    </>
  );
}
