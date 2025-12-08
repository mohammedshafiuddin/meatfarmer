import { Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { tw, AppContainer } from 'common-ui';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </AppContainer>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(drawer)/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}