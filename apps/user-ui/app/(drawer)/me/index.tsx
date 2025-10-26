import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';

export default function Me() {
  const router = useRouter();

  return (
    <AppContainer>
      <View style={tw`flex-1 p-4`}>
        <MyText style={tw`text-2xl font-bold mb-8 text-center`}>My Account</MyText>

        <View style={tw`space-y-4`}>
          <TouchableOpacity
            style={tw`bg-blue-500 p-4 rounded-lg`}
            onPress={() => router.push('/(drawer)/my-orders')}
          >
            <MyText style={tw`text-white text-center text-lg font-semibold`}>Orders</MyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-green-500 p-4 rounded-lg`}
            onPress={() => router.push('/(drawer)/complaints')}
          >
            <MyText style={tw`text-white text-center text-lg font-semibold`}>Complaints</MyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-purple-500 p-4 rounded-lg`}
            onPress={() => {}}
          >
            <MyText style={tw`text-white text-center text-lg font-semibold`}>Coupons</MyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-orange-500 p-4 rounded-lg`}
            onPress={() => {}}
          >
            <MyText style={tw`text-white text-center text-lg font-semibold`}>Profile</MyText>
          </TouchableOpacity>
        </View>
      </View>
    </AppContainer>
  );
}