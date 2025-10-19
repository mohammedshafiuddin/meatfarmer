 import { Drawer } from "expo-router/drawer";
 import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
 import { useRouter } from "expo-router";
 import { TouchableOpacity, DeviceEventEmitter } from "react-native";
 import MaterialIcons from "@expo/vector-icons/MaterialIcons";
 import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";

function CustomDrawerContent() {
  const router = useRouter();

  return (
    <DrawerContentScrollView>
      <DrawerItem
        label="Dashboard"
        onPress={() => router.push("/(drawer)/dashboard")}
      />
      <DrawerItem
        label="My Orders"
        onPress={() => router.push("/(drawer)/my-orders")}
      />
    </DrawerContentScrollView>
  );
}

  export default function Layout() {
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