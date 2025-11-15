import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter, Redirect } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import {
  TouchableOpacity,
  DeviceEventEmitter,
  View,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
import { useStaffAuth } from "@/components/context/staff-auth-context";
import { tw, MyText, theme } from "common-ui";

function CustomDrawerContent() {
  const router = useRouter();
  const { logout, staff } = useStaffAuth();

  return (
    <DrawerContentScrollView>
      {staff && (
        <View style={tw`p-4 border-b border-gray-200`}>
          <MaterialIcons name="person" size={40} color="#3B82F6" />
          <View style={tw`mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800`}>
              {staff.name}
            </MyText>
            <MyText style={tw`text-sm text-gray-600`}>Staff Member</MyText>
          </View>
        </View>
      )}
      <DrawerItem
        label="Dashboard"
        onPress={() => router.push("/(drawer)/dashboard" as any)}
        icon={({ color, size }) => (
          <MaterialIcons name="dashboard" size={size} color={color} />
        )}
      />
       {/* <DrawerItem
         label="Add Product"
         onPress={() => router.push("/(drawer)/add-product" as any)}
         icon={({ color, size }) => (
           <MaterialIcons name="add" size={size} color={color} />
         )}
       /> */}
       <DrawerItem
         label="Products"
         onPress={() => router.push("/(drawer)/products" as any)}
         icon={({ color, size }) => (
           <MaterialIcons name="inventory" size={size} color={color} />
         )}
       />
       <DrawerItem
         label="Slots"
         onPress={() => router.push("/(drawer)/slots" as any)}
         icon={({ color, size }) => (
           <MaterialIcons name="schedule" size={size} color={color} />
         )}
       />
      {/* <DrawerItem
        label="Edit Product"
        onPress={() => router.push("/(drawer)/edit-product" as any)}
        icon={({ color, size }) => (
          <MaterialIcons name="edit" size={size} color={color} />
        )}
      /> */}
      <DrawerItem
        label="Complaints"
        onPress={() => router.push("/(drawer)/complaints" as any)}
        icon={({ color, size }) => (
          <MaterialIcons name="report-problem" size={size} color={color} />
        )}
      />
      <DrawerItem
        label="Manage Orders"
        onPress={() => router.push("/(drawer)/manage-orders" as any)}
        icon={({ color, size }) => (
          <MaterialIcons name="shopping-bag" size={size} color={color} />
        )}
      />
       <DrawerItem
         label="Coupons"
         onPress={() => router.push("coupons" as any)}
         icon={({ color, size }) => (
           <MaterialIcons name="local-offer" size={size} color={color} />
         )}
       />
        <DrawerItem
          label="Vendor Snippets"
          onPress={() => router.push("vendor-snippets" as any)}
          icon={({ color, size }) => (
            <MaterialIcons name="code" size={size} color={color} />
          )}
        />
        <DrawerItem
          label="Stores"
          onPress={() => router.push("/(drawer)/stores" as any)}
          icon={({ color, size }) => (
            <MaterialIcons name="store" size={size} color={color} />
          )}
        />
        <DrawerItem
          label="Logout"
         onPress={() => logout()}
         icon={({ color, size }) => (
           <MaterialIcons name="logout" size={size} color={color} />
         )}
       />
    </DrawerContentScrollView>
  );
}

export default function Layout() {
  const { isLoggedIn, isLoading } = useStaffAuth();

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Drawer
      backBehavior="history"
      drawerContent={CustomDrawerContent}
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.gray1,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { height: 0, width: 0 },
          elevation: 0,
        },
        headerTitleAlign: "center",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => (navigation as any).openDrawer()}
            style={{
              marginLeft: 15,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f2f2f2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="menu" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={{
              marginRight: 15,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f2f2f2",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              DeviceEventEmitter.emit(REFRESH_EVENT);
            }}
          >
            <MaterialIcons name="refresh" size={24} color="black" />
          </TouchableOpacity>
        ),
      })}
    >
       <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
       <Drawer.Screen name="add-product" options={{ title: "Add Product" }} />
       <Drawer.Screen name="products" options={{ title: "Products" }} />
       <Drawer.Screen name="slots" options={{ title: "Slots" }} />
      <Drawer.Screen name="edit-product" options={{ title: "Edit Product" }} />
      <Drawer.Screen
        name="manage-orders"
        options={{ title: "Manage Orders" }}
      />
       <Drawer.Screen name="complaints" options={{ title: "Complaints" }} />
       <Drawer.Screen name="coupons" options={{ title: "Coupons" }} />
        <Drawer.Screen name="vendor-snippets" options={{ title: "Vendor Snippets" }} />
        <Drawer.Screen name="stores" options={{ title: "Stores" }} />
     </Drawer>
  );
}
