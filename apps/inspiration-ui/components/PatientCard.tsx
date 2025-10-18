import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MyText, tw, ImageViewerURI } from 'common-ui';
import dayjs from 'dayjs';

const PatientCard = ({ patient }: { patient: any }) => {
  const router = useRouter();

  const handleNamePress = () => {
    router.push(`/patient-details?id=${patient.id}`);
  };

  return (
    <View style={tw`bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200`}>
      <View style={tw`flex-row items-center`}>
        <View style={tw`mr-4`}>
          {patient.imageUrl ? (
            <ImageViewerURI
              uri={patient.imageUrl}
              style={tw`w-16 h-16 rounded-full`}
            />
          ) : (
            <View style={tw`w-16 h-16 rounded-full bg-blue-100 items-center justify-center`}>
              <MyText style={tw`text-xl font-bold text-blue-600`}>
                {patient.name.charAt(0)}
              </MyText>
            </View>
          )}
        </View>
        <View style={tw`flex-1`}>
          <TouchableOpacity onPress={handleNamePress}>
            <MyText weight="bold" style={tw`text-lg text-blue-600 underline`}>{patient.name}</MyText>
          </TouchableOpacity>
          <View style={tw`flex-row mt-1`}>
            <MyText style={tw`text-gray-600`}>{patient.age} years, {patient.gender}</MyText>
            <MyText style={tw`text-gray-600 ml-3`}>Mobile: {patient.mobile}</MyText>
          </View>
           <View style={tw`flex-row mt-1`}>
            <MyText style={tw`text-gray-600`}>
              Last Visit: {dayjs(patient.lastVisitDate).isValid() ? dayjs(patient.lastVisitDate).format('D MMM YYYY') : 'N/A'}
            </MyText>
           </View>
        </View>
      </View>
    </View>
  );
};

export default PatientCard;