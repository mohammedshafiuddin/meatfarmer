import { Redirect } from 'expo-router';
import { useStaffAuth } from '@/components/context/staff-auth-context';
import { View, ActivityIndicator } from 'react-native';
import { AppContainer } from 'common-ui';

export default function Index() {
  const { isLoggedIn, isLoading } = useStaffAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </AppContainer>
    );
  }

  return <Redirect href={isLoggedIn ? "/(drawer)/dashboard" : "/login"} />;
}