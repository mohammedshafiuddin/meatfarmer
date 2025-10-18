import React from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tw , MyText , MyButton } from 'common-ui';
import HorizontalImageScroller from '@/components/HorizontalImageScroller';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/components/context/auth-context';
import { useGetHospitalById, useHospitalAdminDashboard } from '@/api-hooks/hospital.api';
import { useThemeColor } from '@/hooks/useThemeColor';
import AppContainer from '@/components/app-container';

export default function MyHospital() {
  const router = useRouter();
  const { responsibilities } = useAuth();
  const hospitalId = responsibilities?.hospitalAdminFor || undefined;
  
  const { 
    data: hospital, 
    isLoading: isLoadingHospital, 
    error: hospitalError 
  } = useGetHospitalById(hospitalId);
  
  
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError
  } = useHospitalAdminDashboard(hospitalId);
  
  const accentColor = useThemeColor({ light: "#4f46e5", dark: "#818cf8" }, "tint");
  
  const isLoading = isLoadingHospital || isLoadingDashboard;
  const error = hospitalError || dashboardError;
  
  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center p-4`}>
        <ActivityIndicator size="large" color={accentColor} />
        <MyText style={tw`mt-4 text-gray-600`}>Loading hospital details...</MyText>
      </ThemedView>
    );
  }
  
  if (error || !hospital) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center p-4`}>
        <MyText style={tw`text-red-500 text-lg mb-4`}>Error loading hospital</MyText>
        <MyText style={tw`text-gray-600 mb-6 text-center`}>
          {error?.message || 'Hospital not found or could not be loaded.'}
        </MyText>
      </ThemedView>
    );
  }
  
  return (
    <AppContainer>
        <View style={tw`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <MyText style={tw`text-2xl font-bold flex-1`}>{hospital.name}</MyText>
            <TouchableOpacity 
              onPress={() => router.push("/(drawer)/my-hospital/edit-hospital" as any)}
              style={tw`ml-2 p-1`}
            >
              <Ionicons name="create-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={tw`mt-4`}>
            <MyText style={tw`text-lg font-semibold mb-2`}>Address</MyText>
            <MyText style={tw`text-gray-700 dark:text-gray-300`}>{hospital.address}</MyText>
          </View>

          {hospital.description && (
            <View style={tw`mt-4`}>
              <MyText style={tw`text-lg font-semibold mb-2`}>Description</MyText>
              <MyText style={tw`text-gray-700 dark:text-gray-300`}>{hospital.description}</MyText>
            </View>
          )}

          {/* Hospital Images Section */}
          {hospital.hospitalImages && hospital.hospitalImages.length > 0 && (
            <View style={tw`mt-4`}>
              <MyText style={tw`text-lg font-semibold mb-2`}>Hospital Images</MyText>
              <HorizontalImageScroller urls={hospital.hospitalImages} imageHeight={128} imageWidth={128} />
            </View>
          )}
        </View>
        
        {/* Hospital Statistics */}
        {dashboardData && (
          <View style={tw`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4`}>
            <MyText style={tw`text-xl font-semibold mb-4`}>Hospital Statistics</MyText>
            <View style={tw`flex-row justify-between mb-2`}>
              <View style={tw`bg-blue-100 dark:bg-blue-900 p-3 rounded-lg flex-1 mr-2`}>
                <MyText style={tw`text-center font-bold text-lg text-blue-700 dark:text-blue-300`}>
                  {dashboardData.totalDoctors}
                </MyText>
                <MyText style={tw`text-center text-blue-700 dark:text-blue-300`}>Doctors</MyText>
              </View>
              <View style={tw`bg-green-100 dark:bg-green-900 p-3 rounded-lg flex-1 ml-2`}>
                <MyText style={tw`text-center font-bold text-lg text-green-700 dark:text-green-300`}>
                  {dashboardData.totalAppointmentsToday}
                </MyText>
                <MyText style={tw`text-center text-green-700 dark:text-green-300`}>Appointments Today</MyText>
              </View>
            </View>
            <MyText style={tw`text-gray-500 text-sm text-right mt-2`}>
              As of {new Date(dashboardData.currentDate).toLocaleDateString()}
            </MyText>
          </View>
        )}
        
        {/* Doctors List */}
        {dashboardData?.doctors && dashboardData.doctors.length > 0 && (
          <View style={tw`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <MyText style={tw`text-xl font-semibold`}>Doctors</MyText>
              <MyText style={tw`text-sm text-gray-500`}>
                {dashboardData.doctors.length} {dashboardData.doctors.length === 1 ? 'doctor' : 'doctors'}
              </MyText>
            </View>
            
            {dashboardData.doctors.map((doctor) => (
              <TouchableOpacity 
                key={doctor.id}
                style={tw`flex-row border-b border-gray-200 dark:border-gray-700 py-3`}
                onPress={() => router.push(`/(drawer)/dashboard/user-details/${doctor.id}` as any)}
              >
                <View style={tw`h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3`}>
                  {doctor.profilePicUrl ? (
                    <Image 
                      source={{ uri: doctor.profilePicUrl }} 
                      style={tw`h-16 w-16`}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={tw`h-16 w-16 bg-gray-300 dark:bg-gray-600 items-center justify-center`}>
                      <MyText style={tw`text-2xl text-gray-500 dark:text-gray-400`}>
                        {doctor.name.charAt(0)}
                      </MyText>
                    </View>
                  )}
                </View>
                
                <View style={tw`flex-1 justify-center`}>
                  <MyText style={tw`font-bold text-base`}>{doctor.name}</MyText>
                  {doctor.qualifications && (
                    <MyText style={tw`text-gray-600 dark:text-gray-400 text-sm`}>
                      {doctor.qualifications}
                    </MyText>
                  )}
                  <View style={tw`flex-row mt-1`}>
                    <View style={tw`bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mr-2`}>
                      <MyText style={tw`text-blue-700 dark:text-blue-300 text-xs`}>
                        Fee: ₹{doctor.consultationFee}
                      </MyText>
                    </View>
                    <View style={tw`${doctor.isAvailable ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} px-2 py-1 rounded`}>
                      <MyText style={tw`${doctor.isAvailable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} text-xs`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </MyText>
                    </View>
                  </View>
                </View>
                
                <View style={tw`justify-center items-center ml-2`}>
                  <MyText style={tw`text-gray-500 text-sm`}>
                    View
                  </MyText>
                  <MyText style={tw`text-gray-500 text-xl`}>
                    →
                  </MyText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={tw`mt-8 px-4`}>
          <View style={tw`flex-row gap-3`}>
            <MyButton
              mode="contained"
              textContent="Edit Hospital"
              onPress={() => router.push("/(drawer)/my-hospital/edit-hospital" as any)}
              style={tw`flex-1 rounded-lg py-4 bg-blue-500`}
            />
            
            <MyButton
              mode="contained"
              textContent="Add Doctor"
              onPress={() => {
                // Redirect to add doctor form with fixed values
                router.push("/(drawer)/my-hospital/add-doctor" as any);
              }}
              style={tw`flex-1 rounded-lg py-4 bg-green-500`}
            />
          </View>
        </View>
    </AppContainer>
  );
}

