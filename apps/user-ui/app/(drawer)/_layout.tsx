   import { Drawer } from "expo-router/drawer";
   import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
   import { useRouter, Redirect } from "expo-router";
   import { useNavigation, DrawerActions } from "@react-navigation/native";
   import { TouchableOpacity, DeviceEventEmitter, View, ActivityIndicator, Image } from "react-native";
   import MaterialIcons from "@expo/vector-icons/MaterialIcons";
   import { REFRESH_EVENT } from "common-ui/src/lib/const-strs";
   import { useAuth } from "@/src/contexts/AuthContext";
   import { tw, MyText, theme } from "common-ui";

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
        label=""
        onPress={() => router.push("/(drawer)/dashboard")}
        icon={({ color, size }) => (
          <MaterialIcons name="dashboard" size={size} color={color} />
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
           ) : undefined,
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
          name="me"
          options={{
            title: "Me",
          }}
        />
      </Drawer>
    );
  }