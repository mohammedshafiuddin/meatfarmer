import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { MyText , tw } from "common-ui";
import { useGetDoctorById, useGetUserById } from '@/api-hooks/user.api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DoctorDetailsProps {
  doctorId: number;
  onPress?: () => void;
  showFullDetails?: boolean;
  onEditPress?: () => void;
}

const DoctorDetails: React.FC<DoctorDetailsProps> = ({ doctorId, onPress, showFullDetails = false, onEditPress }) => {
  const router = useRouter();
  // const { data: doctor, isLoading, isError, error } = useGetUserById(doctorId);
  const { data: doctor, isLoading, isError, error } = useGetDoctorById(doctorId);

  // Handle loading state
  if (isLoading) {
    return (
      <View style={tw`p-4 bg-white dark:bg-gray-800 rounded-2xl mb-4 border border-gray-200 dark:border-gray-700`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mr-4`} />
          <View style={tw`flex-1`}>
            <View style={tw`h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4`} />
            <View style={tw`h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2`} />
            <View style={tw`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3`} />
          </View>
        </View>
      </View>
    );
  }

  // Handle error state
  if (isError || !doctor) {
    return (
      <View style={tw`p-4 bg-white dark:bg-gray-800 rounded-2xl mb-4 border border-red-200 dark:border-red-900`}>
        <MyText style={tw`text-red-500 dark:text-red-400 text-center`}>
          {error?.message || 'Failed to load doctor details'}
        </MyText>
      </View>
    );
  }
  

  return (
    <TouchableOpacity 
      style={tw`p-4 bg-white dark:bg-gray-800 rounded-2xl mb-4 shadow-sm border border-gray-200 dark:border-gray-700`}
      onPress={onPress}
    >
      <View style={tw`flex-row`}>
        {/* Doctor Image */}
        <View style={tw`mr-4`}>
          {doctor.profilePicUrl ? (
            <Image
              source={{ uri: doctor.profilePicUrl }}
              style={tw`w-16 h-16 rounded-full border-2 border-blue-500`}
            />
          ) : (
            <View style={tw`w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center border-2 border-blue-500`}>
              <Ionicons name="person" size={24} color="#4f46e5" />
            </View>
          )}
        </View>
        
        {/* Doctor Info */}
        <View style={tw`flex-1`}>
          <View style={tw`flex-row justify-between items-start`}>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white`}>
                  Dr. {doctor.name}
                </MyText>
                {showFullDetails && onEditPress && (
                  <TouchableOpacity onPress={onEditPress} style={tw`ml-2 p-1`}>
                    <Ionicons name="create-outline" size={20} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Specializations */}
              {doctor.specializations && doctor.specializations.length > 0 && (
                <View style={tw`flex-row flex-wrap mt-1`}>
                  {doctor.specializations.slice(0, 2).map((spec, index) => (
                    <View 
                      key={spec.id} 
                      style={tw`bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full mr-2 mb-1`}
                    >
                      <MyText style={tw`text-blue-700 dark:text-blue-300 text-xs`}>
                        {spec.name}
                      </MyText>
                    </View>
                  ))}
                  {doctor.specializations.length > 2 && (
                    <View style={tw`bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full mr-2 mb-1`}>
                      <MyText style={tw`text-gray-700 dark:text-gray-300 text-xs`}>
                        +{doctor.specializations.length - 2} more
                      </MyText>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Rating */}
            <View style={tw`flex-row items-center bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full`}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <MyText style={tw`text-yellow-800 dark:text-yellow-200 text-xs font-bold ml-1`}>
                4.8
              </MyText>
            </View>
          </View>
          
          {/* Consultation Info */}
          <View style={tw`flex-row mt-2`}>
            <View style={tw`flex-row items-center mr-4`}>
              <Ionicons name="cash" size={16} color="#10b981" />
              <MyText style={tw`text-green-600 dark:text-green-400 text-sm font-medium ml-1`}>
                ₹{doctor.consultationFee || 500}
              </MyText>
            </View>
            
            <View style={tw`flex-row items-center`}>
              <Ionicons name="time" size={16} color="#8b5cf6" />
              <MyText style={tw`text-purple-600 dark:text-purple-400 text-sm font-medium ml-1`}>
                15 mins
              </MyText>
            </View>
          </View>
          
          {/* Experience */}
          <View style={tw`flex-row items-center mt-2`}>
            <Ionicons name="briefcase" size={16} color="#6b7280" />
            <MyText style={tw`text-gray-600 dark:text-gray-400 text-sm ml-1`}>
              {doctor.qualifications} • {doctor.yearsOfExperience} years
            </MyText>
          </View>
        </View>
      </View>
      
      {/* Show full details or action buttons */}
      {showFullDetails ? (
        <View style={tw`mt-4`}>
          {/* Hospital */}
          <View style={tw`flex-row items-center mt-2`}>
            <Ionicons name="business" size={16} color="#6b7280" />
            <MyText style={tw`text-gray-600 dark:text-gray-400 text-sm ml-1`}>
              {doctor.hospital || 'Apollo Hospitals'}
            </MyText>
          </View>
          
          {/* Bio */}
          <View style={tw`mt-3`}>
            <MyText style={tw`text-gray-700 dark:text-gray-300 text-sm`}>
              {doctor.description}
            </MyText>
          </View>
        </View>
      ) : (
        /* Action Buttons */
        <View style={tw`flex-row justify-between mt-4`}>
          <TouchableOpacity 
            style={tw`flex-1 bg-blue-500 py-2 rounded-lg mr-2 items-center`}
            onPress={onPress}
          >
            <MyText style={tw`text-white font-medium`}>View Profile</MyText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={tw`flex-1 bg-white dark:bg-gray-700 border border-blue-500 py-2 rounded-lg ml-2 items-center`}
            onPress={() => router.push(`/(drawer)/dashboard/doctor-details/${doctorId}` as any)}
          >
            <MyText style={tw`text-blue-500 dark:text-blue-400 font-medium`}>Book Now</MyText>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default DoctorDetails;