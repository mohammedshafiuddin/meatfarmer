import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";

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
      {/* <DrawerItem
        label="Product Detail"
        onPress={() => router.push("/(drawer)/product-detail")}
      /> */}
    </DrawerContentScrollView>
  );
}

export default function Layout() {
  return <Drawer drawerContent={CustomDrawerContent} screenOptions={{ headerShown: true }} />;
}