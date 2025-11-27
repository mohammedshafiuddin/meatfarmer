 import React from 'react';
  import { View, TouchableOpacity } from 'react-native';
 import { useRouter } from 'expo-router';
 import MaterialIcons from '@expo/vector-icons/MaterialIcons';
  import { AppContainer, MyText, tw, MyFlatList } from 'common-ui';

 export default function Dashboard() {
   const router = useRouter();

   const menuItems = [
     {
       title: 'Add Product',
       icon: 'add',
       color: 'bg-blue-500',
       onPress: () => router.push('/(drawer)/add-product'),
     },
     {
       title: 'Manage Orders',
       icon: 'shopping-bag',
       color: 'bg-green-500',
       onPress: () => router.push('/(drawer)/manage-orders'),
     },
     {
       title: 'Complaints',
       icon: 'report-problem',
       color: 'bg-purple-500',
       onPress: () => router.push('/(drawer)/complaints'),
     },
     {
       title: 'Coupons',
       icon: 'local-offer',
       color: 'bg-orange-500',
       onPress: () => router.push('/(drawer)/coupons'),
     },

      {
        title: 'Products',
        icon: 'inventory',
        color: 'bg-indigo-500',
        onPress: () => router.push('/(drawer)/products'),
      },
       {
         title: 'Product Tags',
         icon: 'label',
         color: 'bg-pink-500',
         onPress: () => router.push('/(drawer)/product-tags'),
       },
        {
          title: 'Slots',
          icon: 'schedule',
          color: 'bg-cyan-500',
           onPress: () => router.push('/(drawer)/slots' as any),
        },
        {
          title: 'Neo Orders',
          icon: 'receipt',
          color: 'bg-red-500',
          onPress: () => router.push('/(drawer)/neo-orders' as any),
        },
    ];

    return (
      <View style={tw`flex-1`}>
        <MyFlatList
          data={menuItems}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`${item.color} p-4 rounded-2xl mb-4 shadow-lg flex-1 mx-1`}
              onPress={item.onPress}
            >
              <View style={tw`items-center`}>
                <MaterialIcons
                  name={item.icon as any}
                  size={32}
                  color="white"
                  style={tw`mb-3`}
                />
                <MyText style={tw`text-white text-center text-base font-semibold`}>
                  {item.title}
                </MyText>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          columnWrapperStyle={tw`justify-between`}
          contentContainerStyle={tw`p-6 bg-white flex-1` }
        />
      </View>
    );
 }