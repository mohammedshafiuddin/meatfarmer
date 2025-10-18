import { MyText , tw } from "common-ui";
import React from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AddBusinessUserForm from '@/components/add-business-user-form';
import { useGetUserById } from '@/api-hooks/user.api';
import { useDoctorSpecializations } from '@/api-hooks/doctor.api';
import { MaterialIcons } from '@expo/vector-icons';

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
    specializationIds: doctorSpecializations?.map((spec: { id: number }) => spec.id) || []
  } : undefined;

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <MyText style={tw`mt-4 text-gray-600 font-medium`}>Loading user data...</MyText>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={tw`flex-1 justify-center items-center p-5 bg-gray-50`}>
        <View style={tw`w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4`}>
          <MaterialIcons name="error" size={32} color="#ef4444" />
        </View>
        <MyText style={tw`text-red-600 text-lg font-bold mb-2`}>Error loading user</MyText>
        <MyText style={tw`text-gray-600 text-center mb-6`}>
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
    <ScrollView contentContainerStyle={tw`flex-grow p-5`} style={tw`bg-gray-50`}>
      <View style={tw`flex-col gap-4`}>
        <View style={tw`items-center mb-6`}>
          <View style={tw`w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4`}>
            <MaterialIcons name="edit" size={32} color="#3b82f6" />
          </View>
          <MyText style={tw`text-2xl font-bold text-gray-800`}>Edit Business User</MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>
            Update the details for {user.name}
          </MyText>
        </View>
        <View style={tw`bg-white rounded-xl shadow-sm p-5 border border-gray-100`}>
          <AddBusinessUserForm 
            userData={userData} 
            isEditing={true}
            onSuccess={() => router.push("/(drawer)/admin-panel/manage-business-users")} 
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default EditBusinessUser;
