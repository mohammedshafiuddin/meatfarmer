import { Redirect } from 'expo-router';
import { useStaffAuth } from '@/components/context/staff-auth-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoggedIn, isLoading } = useStaffAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? "/(drawer)/dashboard" : "/login"} />;
}