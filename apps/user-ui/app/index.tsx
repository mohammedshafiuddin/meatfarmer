import { Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { tw } from 'common-ui';

export default function Index() {
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
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}