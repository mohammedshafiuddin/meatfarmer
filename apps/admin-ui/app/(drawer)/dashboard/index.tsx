 import React from 'react';
 import { View, TouchableOpacity } from 'react-native';
 import { useRouter } from 'expo-router';
 import MaterialIcons from '@expo/vector-icons/MaterialIcons';
 import { AppContainer, MyText, tw } from 'common-ui';

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
       title: 'Slots',
       icon: 'schedule',
       color: 'bg-teal-500',
       onPress: () => router.push('/(drawer)/slots'),
     },
      {
        title: 'Products',
        icon: 'inventory',
        color: 'bg-indigo-500',
        onPress: () => router.push('/(drawer)/products'),
      },
   ];

   return (
     <AppContainer>
       <View style={tw`flex-1 p-6`}>
         <MyText style={tw`text-3xl font-bold mb-2 text-center text-gray-800`}>Admin Dashboard</MyText>
         <MyText style={tw`text-base text-center text-gray-600 mb-8`}>Manage your meat farm operations</MyText>

         <View style={tw`flex-row flex-wrap justify-between`}>
           {menuItems.map((item, index) => (
             <TouchableOpacity
               key={index}
               style={tw`w-[48%] ${item.color} p-4 rounded-2xl mb-4 shadow-lg ${index === 5 ? 'self-center' : ''}`}
               onPress={item.onPress}
             >
               <View style={tw`items-center`}>
                 <MaterialIcons
                   name={item.icon as any}
                   size={32}
                   color="white"
                   style={tw`mb-3`}
                 />
                 <MyText style={tw`text-white text-center text-lg font-semibold`}>
                   {item.title}
                 </MyText>
               </View>
             </TouchableOpacity>
           ))}
         </View>
       </View>
     </AppContainer>
   );
 }