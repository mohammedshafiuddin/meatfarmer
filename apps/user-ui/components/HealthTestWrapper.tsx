import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { tw, theme } from 'common-ui';
import { trpc, trpcClient } from '@/src/trpc-client';

interface HealthTestWrapperProps {
  children: React.ReactNode;
}

const HealthTestWrapper: React.FC<HealthTestWrapperProps> = ({ children }) => {
  const { data, isLoading, error, refetch } = trpc.common.healthCheck.useQuery();

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color={theme.colors.pink1} />
        <Text style={tw`text-gray-500 mt-4 font-medium`}>Checking service status...</Text>
      </View>
    );
  }

  if (error || data?.status !== "ok") {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-6`}>
        <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
          <Text style={tw`text-red-600 text-2xl`}>⚠️</Text>
        </View>
        <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>Service Unavailable</Text>
        <Text style={tw`text-gray-600 text-center mb-6 leading-5`}>
          Please check your connection and try again.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={tw`bg-pink1 px-8 py-3 rounded-xl shadow-md`}
          activeOpacity={0.8}
        >
          <Text style={tw`text-white font-bold text-base`}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

export default HealthTestWrapper;