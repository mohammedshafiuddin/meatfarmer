    import { Drawer } from "expo-router/drawer";
    import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
    import { useRouter, Redirect } from "expo-router";
    import { useNavigation, DrawerActions } from "@react-navigation/native";
    import { TouchableOpacity, DeviceEventEmitter, View, ActivityIndicator, Image } from "react-native";
    import { useState, useEffect } from "react";
    import MaterialIcons from "@expo/vector-icons/MaterialIcons";
    import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
    import { useAuth, useUserDetails } from "@/src/contexts/AuthContext";
    import { tw, MyText, theme } from "common-ui";
    import { trpc } from "@/src/trpc-client";

function CustomDrawerContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const userDetails = useUserDetails();
  const [isStoresExpanded, setIsStoresExpanded] = useState(false);
  const { data: storesData, isLoading: isLoadingStores } = trpc.common.getStoresSummary.useQuery();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <DrawerContentScrollView>
      {userDetails && (
        <View style={tw`p-4 border-b border-gray-200`}>
          {userDetails.profileImage ? (
            <Image
              source={{ uri: userDetails.profileImage }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                resizeMode: 'cover'
              }}
            />
          ) : (
            <MaterialIcons name="person" size={40} color="#3B82F6" />
          )}
          <View style={tw`mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800`}>
              {userDetails.name}
            </MyText>
            <MyText style={tw`text-sm text-gray-600`}>
              {userDetails.mobile}
            </MyText>
          </View>
        </View>
      )}
      <DrawerItem
        label="Home"
        onPress={() => router.push("/(drawer)/dashboard")}
        icon={({ color, size }) => (
          <MaterialIcons name="home" size={size} color={color} />
        )}
      />
      <TouchableOpacity
        onPress={() => setIsStoresExpanded(!isStoresExpanded)}
        style={tw`flex-row items-center p-3`}
      >
        <MaterialIcons name="store" size={24} color="#374151" style={tw`mr-3`} />
        <MyText style={tw`flex-1 text-gray-800`}>Stores</MyText>
        <View style={{ transform: [{ rotate: isStoresExpanded ? '180deg' : '0deg' }] }}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#374151" />
        </View>
      </TouchableOpacity>
      {isStoresExpanded && (
        <View style={tw`ml-4`}>
          {isLoadingStores ? (
            <MyText style={tw`text-gray-500 p-2`}>Loading stores...</MyText>
          ) : storesData?.stores?.length ? (
            storesData.stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                onPress={() => {
                  router.push(`/(drawer)/stores?storeId=${store.id}`);
                }}
                style={tw`p-3 pl-8 mb-1`}
              >
                <MyText style={tw`text-sm font-medium`}>{store.name}</MyText>
              </TouchableOpacity>
            ))
          ) : (
            <MyText style={tw`text-gray-500 p-2`}>No stores available</MyText>
          )}
        </View>
      )}
        <DrawerItem
          label="My Cart"
          onPress={() => router.push("/(drawer)/my-cart")}
          icon={({ color, size }) => (
            <MaterialIcons name="shopping-cart" size={size} color={color} />
          )}
        />
        <DrawerItem
          label="Delivery Slots"
          onPress={() => router.push("/(drawer)/delivery-slots")}
          icon={({ color, size }) => (
            <MaterialIcons name="schedule" size={size} color={color} />
          )}
        />
         <DrawerItem
           label="Me"
           onPress={() => router.push("/(drawer)/me")}
           icon={({ color, size }) => (
             <MaterialIcons name="person" size={size} color={color} />
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
      const router = useRouter();
      const navigation = useNavigation();
      const [drawerTitle, setDrawerTitle] = useState<string | undefined>(undefined);

      useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('updateDrawerTitle', (title: string) => {
          setDrawerTitle(title);
        });
        return () => subscription.remove();
      }, []);

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
        // style={{ backgroundColor: theme.colors.gray1 }}
         screenOptions={({ navigation, route }) => ({
           headerShown: true,
           headerStyle: {
             backgroundColor: theme.colors.gray1,
             shadowOpacity: 0,
             shadowRadius: 0,
             shadowOffset: { height: 0, width:0 },
             elevation: 0,
           },
            headerTitle: route.name === "dashboard" ? () => (
             <View style={tw`-ml-8`}>
              <Image
                source={require("@/assets/logo.png")}
                style={{ width: 120, height: 40, resizeMode: "contain" }}
                />
                </View>
            ) : (drawerTitle ? drawerTitle : undefined),
           headerTitleAlign: 'center',
           headerLeft: () => (
             <TouchableOpacity
               onPress={() => (navigation as any).openDrawer()}
               style={{
                 marginLeft: 15,
                 width: 40,
                 height: 40,
                 borderRadius: 20,
                 backgroundColor: theme.colors.gray2,
                 justifyContent: 'center',
                 alignItems: 'center',
               }}
             >
               <MaterialIcons name="menu" size={24} color="black" />
             </TouchableOpacity>
           ),
           headerRight: () => (
             <View style={{ flexDirection: 'row', marginRight: 15 }}>
               <TouchableOpacity
                 onPress={() => router.push('/my-cart')}
                 style={{
                   marginRight: 10,
                   width: 40,
                   height: 40,
                   borderRadius: 20,
                   justifyContent: 'center',
                   alignItems: 'center',
                 }}
               >
                 <View style={{
                   position: 'absolute',
                   width: 40,
                   height: 40,
                   borderRadius: 20,
                   backgroundColor: theme.colors.pink1,
                   opacity: 0.7,
                 }} />
                 <MaterialIcons name="shopping-cart" size={24} color="white" />
               </TouchableOpacity>
               <TouchableOpacity
                 onPress={() => DeviceEventEmitter.emit(REFRESH_EVENT)}
                 style={{
                   width: 40,
                   height: 40,
                   borderRadius: 20,
                   justifyContent: 'center',
                   alignItems: 'center',
                 }}
               >
                 <View style={{
                   position: 'absolute',
                   width: 40,
                   height: 40,
                   borderRadius: 20,
                   backgroundColor: theme.colors.pink1,
                   opacity: 0.7,
                 }} />
                  <MaterialIcons name="person" size={24} color="white" />
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
          }}
        />
        <Drawer.Screen
          name="me"
          options={{
            title: "Me",
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
    );
  }