import React from 'react';
import { View } from 'react-native';
import { BottomDialog, MyText, MyButton, useIsDevMode } from 'common-ui';
import { trpc } from '../src/trpc-client';
import { useRouter } from 'expo-router';

const ProfileChecker: React.FC = () => {
  const router = useRouter();
  const isDevMode = useIsDevMode();
  const { data, isLoading } = trpc.user.user.checkProfileComplete.useQuery();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && data && !data.isComplete) {
      setDialogOpen(true);
    }
  }, [data, isLoading]);

  if (isLoading || isDevMode) return null;

  return (
    <BottomDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
      <View style={{ padding: 20 }}>
        <MyText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Complete Your Profile
        </MyText>
        <MyText style={{ marginBottom: 24 }}>
          Please complete your profile for a better experience.
        </MyText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
          <MyButton
            textContent="Update Later"
            onPress={() => setDialogOpen(false)}
            fillColor="gray1"
            textColor="black1"
          />
          <MyButton
            textContent="Update Now"
            onPress={() => { setDialogOpen(false); router.push('/(drawer)/edit-profile'); }}
            fillColor="blue1"
            textColor="white1"
          />
        </View>
      </View>
    </BottomDialog>
  );
};

export default ProfileChecker;