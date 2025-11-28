import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter, Redirect } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import {
  TouchableOpacity,
  DeviceEventEmitter,
  View,
  ActivityIndicator,
  Image,
  Text,
  StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
import { useAuth, useUserDetails } from "@/src/contexts/AuthContext";
import { tw, MyText, theme } from "common-ui";
import { trpc } from "@/src/trpc-client";
import ProfileChecker from "@/components/ProfileChecker";

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { logout } = useAuth();
  const userDetails = useUserDetails();
  const [isStoresExpanded, setIsStoresExpanded] = useState(false);
  const { data: storesData, isLoading: isLoadingStores } =
    trpc.common.getStoresSummary.useQuery();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={tw`bg-pink1 px-6 pt-16 pb-8 mb-4 rounded-br-[40px]`}>
          <View style={tw`flex-row items-center mb-4`}>
            {userDetails?.profileImage ? (
              <Image
                source={{ uri: userDetails.profileImage }}
                style={tw`w-16 h-16 rounded-full border-4 border-white/30`}
              />
            ) : (
              <View style={tw`w-16 h-16 rounded-full bg-white/20 items-center justify-center border-4 border-white/30`}>
                <MaterialIcons name="person" size={40} color="white" />
              </View>
            )}
            <View style={tw`ml-4 flex-1`}>
              <Text style={tw`text-white text-xl font-bold`} numberOfLines={1}>
                {userDetails?.name || "Guest"}
              </Text>
              <Text style={tw`text-pink-100 text-sm`}>
                {userDetails?.mobile || "No mobile number"}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={tw`px-3`}>
          <DrawerItem
            label="Home"
            onPress={() => router.push("/(drawer)/dashboard")}
            icon={({ color, size }) => (
              <MaterialIcons name="home" size={22} color={color} />
            )}
            activeTintColor={theme.colors.pink1}
            inactiveTintColor="#4B5563"
            activeBackgroundColor="#FFF0F6"
            labelStyle={tw`font-medium ml-[-10px]`}
            style={tw`rounded-xl mb-1`}
          />

          <TouchableOpacity
            onPress={() => setIsStoresExpanded(!isStoresExpanded)}
            style={tw`flex-row items-center p-3 rounded-xl mb-1 ${isStoresExpanded ? 'bg-gray-50' : ''}`}
          >
            <MaterialIcons
              name="store"
              size={22}
              color="#4B5563"
              style={tw`mr-3`}
            />
            <Text style={tw`flex-1 text-gray-600 font-medium`}>Stores</Text>
            <MaterialIcons
              name={isStoresExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {isStoresExpanded && (
            <View style={tw`ml-4 border-l-2 border-gray-100 pl-2 mb-2`}>
              {isLoadingStores ? (
                <Text style={tw`text-gray-400 p-2 text-sm`}>Loading stores...</Text>
              ) : storesData?.stores?.length ? (
                storesData.stores.map((store) => (
                  <TouchableOpacity
                    key={store.id}
                    onPress={() => {
                      router.push(`/(drawer)/stores?storeId=${store.id}`);
                    }}
                    style={tw`p-3 rounded-lg mb-1`}
                  >
                    <Text style={tw`text-sm text-gray-600 font-medium`}>{store.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={tw`text-gray-400 p-2 text-sm`}>No stores available</Text>
              )}
            </View>
          )}

          <DrawerItem
            label="My Cart"
            onPress={() => router.push("/(drawer)/my-cart")}
            icon={({ color, size }) => (
              <MaterialIcons name="shopping-cart" size={22} color={color} />
            )}
            activeTintColor={theme.colors.pink1}
            inactiveTintColor="#4B5563"
            activeBackgroundColor="#FFF0F6"
            labelStyle={tw`font-medium ml-[-10px]`}
            style={tw`rounded-xl mb-1`}
          />

          <DrawerItem
            label="Delivery Slots"
            onPress={() => router.push("/(drawer)/delivery-slots")}
            icon={({ color, size }) => (
              <MaterialIcons name="schedule" size={22} color={color} />
            )}
            activeTintColor={theme.colors.pink1}
            inactiveTintColor="#4B5563"
            activeBackgroundColor="#FFF0F6"
            labelStyle={tw`font-medium ml-[-10px]`}
            style={tw`rounded-xl mb-1`}
          />

          <DrawerItem
            label="My Profile"
            onPress={() => router.push("/(drawer)/me")}
            icon={({ color, size }) => (
              <MaterialIcons name="person" size={22} color={color} />
            )}
            activeTintColor={theme.colors.pink1}
            inactiveTintColor="#4B5563"
            activeBackgroundColor="#FFF0F6"
            labelStyle={tw`font-medium ml-[-10px]`}
            style={tw`rounded-xl mb-1`}
          />

          <DrawerItem
            label="About Us"
            onPress={() => router.push("/(drawer)/about")}
            icon={({ color, size }) => (
              <MaterialIcons name="info" size={22} color={color} />
            )}
            activeTintColor={theme.colors.pink1}
            inactiveTintColor="#4B5563"
            activeBackgroundColor="#FFF0F6"
            labelStyle={tw`font-medium ml-[-10px]`}
            style={tw`rounded-xl mb-1`}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={tw`p-4 border-t border-gray-100`}>
        <TouchableOpacity
          onPress={handleLogout}
          style={tw`flex-row items-center p-3 rounded-xl bg-gray-50`}
        >
          <MaterialIcons name="logout" size={22} color="#EF4444" />
          <Text style={tw`ml-3 text-red-500 font-bold`}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Layout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [drawerTitle, setDrawerTitle] = useState<string | undefined>(undefined);

  // Get cart data for badge
  const { data: cartData } = trpc.user.cart.getCart.useQuery();
  const cartItemCount = cartData?.totalItems || 0;

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "updateDrawerTitle",
      (title: string) => {
        setDrawerTitle(title);
      }
    );
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color={theme.colors.pink1} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        backBehavior="history"
        screenOptions={({ navigation, route }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 3,
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerTitle:
            route.name === "dashboard"
              ? () => (
                <View style={tw`-ml-4`}>
                  <Image
                    source={require("@/assets/logo.png")}
                    style={{ width: 110, height: 36, resizeMode: "contain" }}
                  />
                </View>
              )
              : drawerTitle
                ? drawerTitle
                : undefined,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => (navigation as any).openDrawer()}
              style={tw`ml-4 w-10 h-10 rounded-full bg-gray-50 items-center justify-center`}
            >
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={tw`flex-row mr-4`}>
              <View style={tw`relative`}>
                <TouchableOpacity
                  onPress={() => router.push("/my-cart")}
                  style={tw`w-10 h-10 rounded-full bg-pink-50 items-center justify-center mr-2`}
                >
                  <MaterialIcons name="shopping-cart" size={22} color={theme.colors.pink1} />
                </TouchableOpacity>
                {cartItemCount > 0 && (
                  <View style={tw`absolute -top-1 right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center border-2 border-white`}>
                    <Text style={tw`text-white text-[10px] font-bold px-1`}>
                      {cartItemCount > 9 ? '9+' : cartItemCount.toString()}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(drawer)/me")}
                style={tw`w-10 h-10 rounded-full bg-gray-50 items-center justify-center`}
              >
                <MaterialIcons name="person" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          ),
        })}
      >
        <Drawer.Screen
          name="dashboard"
          options={{
            title: "",
          }}
        />
        <Drawer.Screen
          name="product-detail"
          options={{
            title: "Product Details",
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="my-cart"
          options={{
            title: "My Cart",
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="delivery-slots"
          options={{
            title: "Delivery Slots",
          }}
        />
        <Drawer.Screen
          name="my-orders"
          options={{
            title: "My Orders",
          }}
        />
        <Drawer.Screen
          name="complaints"
          options={{
            title: "Complaints",
          }}
        />
        <Drawer.Screen
          name="checkout"
          options={{
            title: "Checkout",
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="me"
          options={{
            title: "Me",
          }}
        />
        <Drawer.Screen
          name="about"
          options={{
            title: "About",
          }}
        />
        <Drawer.Screen
          name="coupons"
          options={{
            title: "Coupons",
          }}
        />
        <Drawer.Screen
          name="addresses"
          options={{
            title: "Addresses",
          }}
        />
      </Drawer>
      <ProfileChecker />
    </>
  );
}
