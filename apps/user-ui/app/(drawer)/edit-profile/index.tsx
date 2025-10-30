import React from "react";
import { View, ScrollView } from "react-native";
import { MyText, tw } from "common-ui";
import RegistrationForm from "@/components/registration-form";
import { useUserDetails, useAuth } from "@/src/contexts/AuthContext";
import { useUpdateProfile } from "@/src/api-hooks/auth.api";
import { router } from "expo-router";

function EditProfile() {
  const userDetails = useUserDetails();
  const { updateUserDetails } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const handleUpdate = async (data: FormData) => {
    try {
      const response = await updateProfileMutation.mutateAsync(data);

      // Update the context with new user details
      if (response.user) {
        updateUserDetails(response.user);
      }

      // Navigate back to profile/me page
      router.replace('/(drawer)/me');
    } catch (error) {
      JSON.stringify(error);
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Prepare initial values from user details
  const initialValues = userDetails ? {
    name: userDetails.name || '',
    email: userDetails.email || '',
    mobile: userDetails.mobile || '',
    profileImageUri: userDetails.profileImage || undefined,
  } : undefined;

  return (
    <ScrollView style={tw`flex-1 bg-white`} showsVerticalScrollIndicator={false}>
      <View style={tw`flex-1 justify-center px-4 py-8`}>
        <View style={tw`mb-8 mt-4`}>
          <MyText
            weight="bold"
            style={tw`text-3xl mb-2 text-center text-gray-800`}
          >
            Edit Profile
          </MyText>
          <MyText style={tw`text-base text-center text-gray-600`}>
            Update your account details
          </MyText>
        </View>

        <RegistrationForm
          onSubmit={handleUpdate}
          isEdit={true}
          initialValues={initialValues}
          isLoading={updateProfileMutation.isPending}
        />
      </View>
    </ScrollView>
  );
}

export default EditProfile;