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
        onPress={() => router.push("/(drawer)/dashboard" as any)}
      />
      <DrawerItem
        label="Add Product"
        onPress={() => router.push("/(drawer)/add-product" as any)}
      />
      <DrawerItem
        label="Manage Slots"
        onPress={() => router.push("/(drawer)/manage-slots" as any)}
      />
      <DrawerItem
        label="Add/Remove Slots"
        onPress={() => router.push("/(drawer)/add-remove-slots" as any)}
      />
       <DrawerItem
         label="Packaging"
         onPress={() => router.push("/(drawer)/packaging" as any)}
       />
       <DrawerItem
         label="Delivery"
         onPress={() => router.push("/(drawer)/delivery" as any)}
       />
       <DrawerItem
         label="Edit Product"
         onPress={() => router.push("/(drawer)/edit-product" as any)}
       />
       <DrawerItem
         label="Complaints"
         onPress={() => router.push("/(drawer)/complaints" as any)}
       />
    </DrawerContentScrollView>
  );
}

export default function Layout() {
  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() => {
              DeviceEventEmitter.emit(REFRESH_EVENT);
            }}
          >
            <MaterialIcons name="refresh" size={24} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Drawer.Screen name="add-product" options={{ title: "Add Product" }} />
      <Drawer.Screen name="manage-slots" options={{ title: "Manage Slots" }} />
      <Drawer.Screen
        name="add-remove-slots"
        options={{ title: "Add/Remove Slots" }}
      />
        <Drawer.Screen
          name="packaging"
          options={{ title: "Packaging" }}
        />
        <Drawer.Screen
          name="delivery"
          options={{ title: "Delivery" }}
        />
       <Drawer.Screen name="edit-product" options={{ title: "Edit Product" }} />
       <Drawer.Screen name="complaints" options={{ title: "Complaints" }} />
    </Drawer>
  );
}
