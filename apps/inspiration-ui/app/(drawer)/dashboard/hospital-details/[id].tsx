import React from 'react';
import { ScrollView, View, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams , useRouter } from 'expo-router';
import { tw , MyText , MyButton , ImageCarousel } from 'common-ui';
import { ThemedView } from '@/components/ThemedView';
import useHideDrawerHeader from '@/hooks/useHideDrawerHeader';
import { useGetHospitalById, useGetHospitalDoctors } from '@/api-hooks/hospital.api';
import { Ionicons } from '@expo/vector-icons';
import type { Hospital, DoctorSpecialization } from 'shared-types';

interface HospitalWithDetails extends Hospital {
  specializations?: DoctorSpecialization[];
}

export default function HospitalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hospitalId = parseInt(id as string);
  const router = useRouter();
  
  // Use the hook to hide the drawer header
  useHideDrawerHeader();
  
  // Fetch hospital data using the dedicated hook
  const { data: hospital, isLoading, error } = useGetHospitalById(hospitalId) as { data: HospitalWithDetails | undefined; isLoading: boolean; error: Error | null };
  
  // Fetch hospital doctors
  const { data: doctorsData, isLoading: isDoctorsLoading } = useGetHospitalDoctors(hospitalId);
  
  // Handle invalid hospital ID
  if (isNaN(hospitalId)) {
    return (
      <ThemedView style={tw`flex-1 p-4 justify-center items-center`}>
        <View style={tw`bg-white dark:bg-gray-800 rounded-2xl p-6 items-center shadow-md w-full max-w-md`}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <MyText style={tw`text-red-500 text-lg font-bold mt-4 mb-2`}>Invalid Hospital ID</MyText>
          <MyText style={tw`text-gray-600 dark:text-gray-400 text-center mb-6`}>
            The hospital ID provided is not valid. Please check and try again.
          </MyText>
          <TouchableOpacity 
            style={tw`bg-blue-500 px-6 py-3 rounded-full`}
            onPress={() => router.back()}
          >
            <MyText style={tw`text-white font-bold text-center`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 p-4 justify-center items-center`}>
        <View style={tw`items-center`}>
          <Ionicons name="business" size={48} color="#4f46e5" />
          <MyText style={tw`text-lg text-center mt-4`}>Loading hospital details...</MyText>
        </View>
      </ThemedView>
    );
  }
  
  // Handle error or not found
  if (error || !hospital) {
    return (
      <ThemedView style={tw`flex-1 p-4 justify-center items-center`}>
        <View style={tw`bg-white dark:bg-gray-800 rounded-2xl p-6 items-center shadow-md w-full max-w-md`}>
          <Ionicons name="warning" size={48} color="#f59e0b" />
          <MyText style={tw`text-yellow-500 text-lg font-bold mt-4 mb-2`}>
            {error ? 'Error Loading Hospital' : 'Hospital Not Found'}
          </MyText>
          <MyText style={tw`text-gray-600 dark:text-gray-400 text-center mb-6`}>
            {error ? 'Failed to load hospital details. Please try again later.' : 'The requested hospital could not be found.'}
          </MyText>
          <TouchableOpacity 
            style={tw`bg-blue-500 px-6 py-3 rounded-full`}
            onPress={() => router.back()}
          >
            <MyText style={tw`text-white font-bold text-center`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={tw`flex-1`}>
      
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Hospital Images */}
        <View style={tw`h-96 bg-gray-200 dark:bg-gray-800`}>
          {hospital.hospitalImages && hospital.hospitalImages.length > 0 ? (
            <ImageCarousel 
              urls={hospital.hospitalImages} 
              imageHeight={400}
            />
          ) : (
            <View style={tw`flex-1 items-center justify-center`}>
              <Ionicons name="business" size={48} color="#9ca3af" />
              <MyText style={tw`mt-2 text-gray-500 dark:text-gray-400`}>
                No images available
              </MyText>
            </View>
          )}
        </View>
        
        {/* Hospital Name and Address */}
        <View style={tw`p-4 bg-white dark:bg-gray-900`}>
          <MyText style={tw`text-2xl font-bold text-gray-800 dark:text-white mb-2`}>
            {hospital.name}
          </MyText>
          <View style={tw`flex-row items-start mt-2`}>
            <Ionicons name="location" size={18} color="#6b7280" style={tw`mt-1 mr-2`} />
            <MyText style={tw`flex-1 text-gray-600 dark:text-gray-300`}>
              {hospital.address}
            </MyText>
          </View>
        </View>
        
        {/* Hospital Description */}
        {hospital.description && (
          <View style={tw`p-4 bg-white dark:bg-gray-900 mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 dark:text-white mb-2`}>
              About
            </MyText>
            <MyText style={tw`text-gray-600 dark:text-gray-300`}>
              {hospital.description}
            </MyText>
          </View>
        )}
        
        {/* Specializations */}
        {hospital.specializations && hospital.specializations.length > 0 && (
          <View style={tw`p-4 bg-white dark:bg-gray-900 mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 dark:text-white mb-2`}>
              Specializations
            </MyText>
            <View style={tw`flex-row flex-wrap`}>
              {hospital.specializations.map((spec) => (
                <View 
                  key={spec.id} 
                  style={[
                    tw`mr-2 mb-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900`, 
                  ]}
                >
                  <MyText style={tw`text-sm text-blue-800 dark:text-blue-200`}>
                    {spec.name}
                  </MyText>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Doctors */}
        {doctorsData && doctorsData.doctors && doctorsData.doctors.length > 0 && (
          <View style={tw`p-4 bg-white dark:bg-gray-900 mt-2`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 dark:text-white mb-2`}>
              Doctors
            </MyText>
            {doctorsData.doctors.map((doctor) => (
              <View key={doctor.id} style={tw`flex-row py-3 border-b border-gray-100 dark:border-gray-800`}>
                {/* Doctor Image */}
                <View style={tw`mr-3`}>
                  {doctor.profilePicUrl ? (
                    <Image 
                      source={{ uri: doctor.profilePicUrl }} 
                      style={tw`w-16 h-16 rounded-full`}
                    />
                  ) : (
                    <View style={tw`w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center`}>
                      <Ionicons name="person" size={24} color="#6b7280" />
                    </View>
                  )}
                </View>
                
                {/* Doctor Info */}
                <View style={tw`flex-1`}>
                  <MyText style={tw`font-bold text-gray-800 dark:text-white`}>
                    {doctor.name}
                  </MyText>
                  {doctor.qualifications && (
                    <MyText style={tw`text-gray-600 dark:text-gray-300 mt-1`}>
                      {doctor.qualifications}
                    </MyText>
                  )}
                  {doctor.specializations && doctor.specializations.length > 0 && (
                    <View style={tw`flex-row flex-wrap mt-2`}>
                      {doctor.specializations.map((spec) => (
                        <View 
                          key={spec.id} 
                          style={[
                            tw`mr-2 mb-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900`, 
                          ]}
                        >
                          <MyText style={tw`text-xs text-green-800 dark:text-green-200`}>
                            {spec.name}
                          </MyText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                
                {/* Book Token Button */}
                <View style={tw`justify-center`}>
                  <TouchableOpacity 
                    style={tw`bg-blue-500 px-3 py-2 rounded-full`}
                    onPress={() => router.push(`/dashboard/doctor-details/${doctor.id}`)}
                  >
                    <MyText style={tw`text-white text-sm font-medium`}>Book Appointment</MyText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        
        </ScrollView>
    </View>
  );
}
