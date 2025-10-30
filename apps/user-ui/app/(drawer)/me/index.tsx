import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppContainer, MyText, tw } from 'common-ui';

export default function Me() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Orders',
      icon: 'shopping-bag',
      color: 'bg-blue-500',
      onPress: () => router.push('/(drawer)/my-orders'),
    },
    {
      title: 'Complaints',
      icon: 'report-problem',
      color: 'bg-green-500',
      onPress: () => router.push('/(drawer)/complaints'),
    },
    {
      title: 'Coupons',
      icon: 'local-offer',
      color: 'bg-purple-500',
      onPress: () => router.push('/(drawer)/coupons'),
    },
    {
      title: 'Profile',
      icon: 'person',
      color: 'bg-orange-500',
      onPress: () => router.push('/(drawer)/edit-profile'),
    },
  ];

  return (
    <AppContainer>
      <View style={tw`flex-1 p-6`}>
        <MyText style={tw`text-3xl font-bold mb-2 text-center text-gray-800`}>My Account</MyText>
        <MyText style={tw`text-base text-center text-gray-600 mb-8`}>Manage your account settings</MyText>

        <View style={tw`flex-row flex-wrap justify-between`}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={tw`w-[48%] ${item.color} p-6 rounded-2xl mb-4 shadow-lg`}
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