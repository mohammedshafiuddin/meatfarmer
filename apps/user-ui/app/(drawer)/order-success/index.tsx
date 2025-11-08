import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, AppContainer } from 'common-ui';

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <AppContainer>
      <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>Order Placed Successfully!</Text>
      {params.orderId && (
        <Text style={tw`text-lg mb-4`}>Order ID: {params.orderId}</Text>
      )}
      <TouchableOpacity
        style={tw`bg-indigo-600 p-4 rounded-md w-full items-center`}
        onPress={() => router.replace('/(drawer)/dashboard')}
      >
        <Text style={tw`text-white text-lg font-bold`}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  </AppContainer>
);
}