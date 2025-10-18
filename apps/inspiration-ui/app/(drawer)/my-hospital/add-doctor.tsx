import React from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { tw , MyText , ROLE_NAMES } from 'common-ui';
import { ThemedView } from '@/components/ThemedView';
import AppContainer from '@/components/app-container';
import AddBusinessUserForm from '@/components/add-business-user-form';
import { useAuth } from '@/components/context/auth-context';

export default function AddDoctorScreen() {
  const router = useRouter();
  const { responsibilities } = useAuth();
  const hospitalId = responsibilities?.hospitalAdminFor;

  // Check if user has hospital admin access
  if (!hospitalId) {
    return (
      <AppContainer>
        <ThemedView style={tw`flex-1 justify-center items-center p-4`}>
          <MyText style={tw`text-lg text-red-500 text-center`}>
            You don't have access to add doctors. Contact an administrator.
          </MyText>
        </ThemedView>
      </AppContainer>
    );
  }

  // Fixed values for doctor role and current hospital
  const fixedValues = {
    role: ROLE_NAMES.DOCTOR,
    hospitalId: hospitalId,
  };

  return (
    <AppContainer>
      <ScrollView style={tw`flex-1 p-4`}>
        <MyText style={tw`text-2xl font-bold mb-6`}>Add New Doctor</MyText>
        
        <AddBusinessUserForm
          fixedValues={fixedValues}
          onSuccess={() => {
            // Navigate back to the my-hospital page after successful addition
            router.push("/(drawer)/my-hospital");
          }}
        />
      </ScrollView>
    </AppContainer>
  );
}