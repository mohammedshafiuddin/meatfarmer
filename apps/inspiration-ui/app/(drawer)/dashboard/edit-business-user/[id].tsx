import { MyText , tw } from "common-ui";
import React from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AddBusinessUserForm from '@/components/add-business-user-form';
import { useGetUserById } from '@/api-hooks/user.api';
import { useDoctorSpecializations } from '@/api-hooks/doctor.api';

function EditBusinessUser() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = parseInt(id || '0');
  
  const { data: user, isLoading: isUserLoading, error } = useGetUserById(userId);
  const { data: doctorSpecializations, isLoading: isSpecLoading } = useDoctorSpecializations(userId);
  
  const isLoading = isUserLoading || isSpecLoading;
  
  // Prepare user data with specializations for the form
  const userData = user ? {
    ...user,
    specializationIds: user.specializations?.map((spec: { id: number }) => spec.id) || []
  } : undefined;

  

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <MyText style={tw`mt-4 text-gray-600`}>Loading user data...</MyText>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={tw`flex-1 justify-center items-center p-5 bg-white`}>
        <MyText style={tw`text-red-500 text-lg mb-4`}>Error loading user</MyText>
        <MyText style={tw`text-gray-600 mb-6`}>
          {error?.message || 'User not found or could not be loaded.'}
        </MyText>
        <MyText 
          style={tw`text-blue-500 font-medium`}
          onPress={() => router.back()}
        >
          Go Back
        </MyText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={tw`flex-grow p-5`} style={tw`bg-white`}>
      <View style={tw`flex-col gap-4`}>
        <MyText style={tw`text-2xl font-bold mb-4 text-blue-900`}>Edit Business User</MyText>
        <AddBusinessUserForm 
          userData={userData} 
          isEditing={true}
          onSuccess={() => router.back()} 
        />
      </View>
    </ScrollView>
  );
}

export default EditBusinessUser;
