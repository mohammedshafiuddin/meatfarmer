import HospitalForm, { initialHospitalValues } from "@/components/hospital-form";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { tw , MyText } from "common-ui";
import AppContainer from "@/components/app-container";
import { MaterialIcons } from '@expo/vector-icons';

function EditHospital() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AppContainer>

        <View style={tw`flex-col gap-4`}>
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4`}>
              <MaterialIcons name="edit" size={32} color="#3b82f6" />
            </View>
            <MyText style={tw`text-2xl font-bold text-gray-800`}>Edit Hospital</MyText>
            <MyText style={tw`text-gray-600 text-center mt-2`}>
              Update the details for this hospital
            </MyText>
          </View>
          <View style={tw`bg-white rounded-xl shadow-sm p-5 border border-gray-100`}>
            <HospitalForm
              initialValues={{ ...initialHospitalValues, id: Number(id) }}
              submitButtonText="Save Changes"
            />
          </View>
        </View>

    </AppContainer>
  );
}

export default EditHospital;
