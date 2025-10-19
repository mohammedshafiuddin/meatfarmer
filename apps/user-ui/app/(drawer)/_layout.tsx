 import { Drawer } from "expo-router/drawer";
 import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
 import { useRouter, Redirect } from "expo-router";
 import { TouchableOpacity, DeviceEventEmitter, View, ActivityIndicator } from "react-native";
 import MaterialIcons from "@expo/vector-icons/MaterialIcons";
 import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
 import { useAuth } from "@/src/contexts/AuthContext";
 import { tw, MyText } from "common-ui";

function CustomDrawerContent() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <DrawerContentScrollView>
      {user && (
        <View style={tw`p-4 border-b border-gray-200`}>
          <MaterialIcons name="person" size={40} color="#3B82F6" />
          <View style={tw`mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800`}>
              {user.name}
            </MyText>
            <MyText style={tw`text-sm text-gray-600`}>
              {user.mobile}
            </MyText>
          </View>
        </View>
      )}
      <DrawerItem
        label="Dashboard"
        onPress={() => router.push("/(drawer)/dashboard")}
        icon={({ color, size }) => (
          <MaterialIcons name="dashboard" size={size} color={color} />
        )}
      />
      <DrawerItem
        label="My Orders"
        onPress={() => router.push("/(drawer)/my-orders")}
        icon={({ color, size }) => (
          <MaterialIcons name="shopping-bag" size={size} color={color} />
        )}
      />
      <DrawerItem
        label="My Cart"
        onPress={() => router.push("/(drawer)/my-cart")}
        icon={({ color, size }) => (
          <MaterialIcons name="shopping-cart" size={size} color={color} />
        )}
      />
      <DrawerItem
        label="Logout"
        onPress={handleLogout}
        icon={({ color, size }) => (
          <MaterialIcons name="logout" size={size} color={color} />
        )}
      />
    </DrawerContentScrollView>
  );
}

  export default function Layout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <View style={tw`flex-1 justify-center items-center bg-white`}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      );
    }

    if (!isAuthenticated) {
      return <Redirect href="/(auth)/login" />;
    }

    return (
      <Drawer
        drawerContent={CustomDrawerContent}
        backBehavior="history"
        screenOptions={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 10 }} onPress={() => DeviceEventEmitter.emit(REFRESH_EVENT)}>
              <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      >
        <Drawer.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
          }}
        />
        <Drawer.Screen
          name="product-detail"
          options={{
            title: "Product Details",
          }}
        />
        <Drawer.Screen
          name="my-orders"
          options={{
            title: "My Orders",
          }}
        />
        <Drawer.Screen
          name="my-cart"
          options={{
            title: "My Cart",
          }}
        />
      </Drawer>
    );
  }