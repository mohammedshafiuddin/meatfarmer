import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { tw } from 'common-ui';
import { useAuth } from '@/src/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(drawer)/dashboard" />;
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* App Logo/Branding */}
      <View style={tw`items-center mt-20 mb-10`}>
        {/* TODO: Add app logo/branding here */}
      </View>

      {/* Screen Content */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}