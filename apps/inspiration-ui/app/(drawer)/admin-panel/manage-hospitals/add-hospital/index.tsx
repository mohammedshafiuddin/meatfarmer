import { MyText , tw } from "common-ui";
import React from 'react';
import { ScrollView, View } from 'react-native';
import HospitalForm from '@/components/hospital-form';
import AppContainer from '@/components/app-container';
import { MaterialIcons } from '@expo/vector-icons';

function AddHospital() {
  return (
    <AppContainer> 
        <View style={tw`flex-col gap-4` }>
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4`}>
              <MaterialIcons name="add-business" size={32} color="#3b82f6" />
            </View>
            <MyText style={tw`text-2xl font-bold text-gray-800`}>Add New Hospital</MyText>
            <MyText style={tw`text-gray-600 text-center mt-2`}>
              Fill in the details below to create a new hospital
            </MyText>
          </View>
          <View style={tw`bg-white rounded-xl shadow-sm border border-gray-100`}>
            <HospitalForm submitButtonText="Add Hospital" />
          </View>
        </View>
    </AppContainer>
  );
}

export default AddHospital;
