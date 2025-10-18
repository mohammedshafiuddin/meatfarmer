import React from "react";
import { View, TouchableOpacity , ActivityIndicator } from "react-native";
import { tw , MyText , ROLE_NAMES } from "common-ui";
import AddBusinessUserForm from "@/components/add-business-user-form";
import { ThemedView } from "@/components/ThemedView";
import { useGetUserById } from "@/api-hooks/user.api";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppContainer from "@/components/app-container";

interface DoctorEditPageProps {
  params: {
    id: number;
  };
}

export default function DoctorEditPage({ params }: DoctorEditPageProps) {
  // const doctorId = parseInt(params.id, 10);
  const { id: doctorId } = useLocalSearchParams();
  const accentColor = useThemeColor(
    { light: "#4f46e5", dark: "#818cf8" },
    "tint"
  );
  const router = useRouter();

  // Fetch doctor details
  const { data: doctorDetails, isLoading, isError } = useGetUserById(Number(doctorId));

  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={accentColor} />
        <MyText style={tw`mt-2`}>Loading doctor details...</MyText>
      </ThemedView>
    );
  }

  if (isError || !doctorDetails) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center p-4`}>
        <MyText style={tw`text-red-500 text-lg text-center mb-4`}>
          Failed to load doctor details
        </MyText>
        <MyText style={tw`text-gray-500 text-center mb-4`}>
          Please try again later
        </MyText>
      </ThemedView>
    );
  }

  // Transform the doctor details to match the form's expected format
  const transformedDoctorData = {
    ...doctorDetails,
    specializationIds: doctorDetails.specializations?.map(spec => spec.id) || [],
  };

  const hospital = doctorDetails?.hospitalId ? Number(doctorDetails?.hospitalId) : undefined;
  
  return (
    <AppContainer>
      {/* Header with back button */}

      
      <View style={tw`flex-1 p-4`}>
        <AddBusinessUserForm 
          userData={transformedDoctorData} 
          isEditing={true} 
          fixedValues={{
            role: ROLE_NAMES.DOCTOR, // Fix the role to prevent changes
            hospitalId: hospital, // Fix the hospital to prevent changes
          }}
          onSuccess={() => {
            router.back(); // Navigate back to the previous screen after successful update
          }}
        />
      </View>
    </AppContainer>
  );
}