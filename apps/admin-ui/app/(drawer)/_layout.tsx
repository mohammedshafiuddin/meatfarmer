import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { TouchableOpacity, DeviceEventEmitter } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
import { useStaffAuth } from "@/components/context/staff-auth-context";

function CustomDrawerContent() {
  const router = useRouter();
  const { logout } = useStaffAuth();

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
         label="Slots"
         onPress={() => router.push("/(drawer)/slots" as any)}
       />
        <DrawerItem
          label="Edit Product"
          onPress={() => router.push("/(drawer)/edit-product" as any)}
        />
        <DrawerItem
          label="Complaints"
          onPress={() => router.push("/(drawer)/complaints" as any)}
        />
          <DrawerItem
            label="Manage Orders"
            onPress={() => router.push("/(drawer)/manage-orders" as any)}
          />
         <DrawerItem
           label="Coupons"
           onPress={() => router.push("coupons")}
         />
        <DrawerItem
          label="Logout"
          onPress={() => logout()}
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
       <Drawer.Screen name="slots" options={{ title: "Slots" }} />
         <Drawer.Screen name="edit-product" options={{ title: "Edit Product" }} />
         <Drawer.Screen name="manage-orders" options={{ title: "Manage Orders" }} />
         <Drawer.Screen name="complaints" options={{ title: "Complaints" }} />
         <Drawer.Screen name="coupons" options={{ title: "Coupons" }} />
    </Drawer>
  );
}
