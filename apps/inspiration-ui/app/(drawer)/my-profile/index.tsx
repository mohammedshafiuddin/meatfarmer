
import { useGetUserById } from '@/api-hooks/user.api';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import React, { useState } from 'react';
import { View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MyText , tw , ROLE_NAMES } from "common-ui";
import { useRouter } from 'expo-router';
import { useRoles } from '@/components/context/roles-context';

export default function MyProfile() {
  const { userId } = useCurrentUserId();
  const roles = useRoles();
  const router = useRouter();
  
  const { data: user, isLoading, isError, refetch } = useGetUserById(userId || 0);
  const [showAllInfo, setShowAllInfo] = useState(false);

  // Determine user type based on roles
  const getUserType = () => {
    if (roles?.includes(ROLE_NAMES.ADMIN)) return 'Administrator';
    if (roles?.includes(ROLE_NAMES.HOSPITAL_ADMIN)) return 'Hospital Administrator';
    if (roles?.includes(ROLE_NAMES.DOCTOR)) return 'Doctor';
    if (roles?.includes(ROLE_NAMES.DOCTOR_SECRETARY)) return 'Doctor Secretary';
    if (roles?.includes(ROLE_NAMES.GENERAL_USER)) return 'User';
    return 'User';
  };

  // Get user-specific dashboard route
  const getUserDashboardRoute = () => {
    if (roles?.includes(ROLE_NAMES.ADMIN)) return '/(drawer)/admin-panel';
    if (roles?.includes(ROLE_NAMES.HOSPITAL_ADMIN)) return '/(drawer)/my-hospital';
    if (roles?.includes(ROLE_NAMES.DOCTOR)) return '/(drawer)/todays-tokens';
    if (roles?.includes(ROLE_NAMES.DOCTOR_SECRETARY)) return '/(drawer)/todays-tokens';
    return '/(drawer)/dashboard';
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            // Clear user data and redirect to login
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-50 dark:bg-gray-900`} contentContainerStyle={tw`pb-8`}>
      <View style={tw`bg-white dark:bg-gray-800 rounded-b-3xl shadow-md pb-6`}>
        {/* Profile Header with Gradient */}
        <View style={tw`h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-3xl relative`}>
          <View style={tw`absolute top-12 left-0 right-0 items-center`}>
            <TouchableOpacity 
              style={tw`relative`}
              onPress={() => router.push('/(drawer)/my-profile/edit' as any)}
            >
              {user?.profilePicUrl ? (
                <Image
                  style={tw`h-24 w-24 rounded-full border-4 border-white dark:border-gray-800`}
                  source={{
                    uri: user.profilePicUrl,
                  }}
                />
              ) : (
                <View style={tw`h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center border-4 border-white dark:border-gray-800`}>
                  <Ionicons name="person" size={32} color="#9ca3af" />
                </View>
              )}
              <View style={tw`absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-2 border-2 border-blue-500`}>
                <Ionicons name="camera" size={16} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* User Info */}
        <View style={tw`items-center mt-16 px-4`}>
          {isLoading && <MyText style={tw`text-center py-4`}>Loading user data...</MyText>}
          {isError && (
            <View style={tw`items-center py-4`}>
              <MyText style={tw`text-center text-red-500 mb-2`}>Error loading user data.</MyText>
              <TouchableOpacity 
                style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
                onPress={() => refetch()}
              >
                <MyText style={tw`text-white`}>Retry</MyText>
              </TouchableOpacity>
            </View>
          )}
          {user && (
            <View style={tw`items-center w-full`}>
              <View style={tw`flex-row items-center mb-1`}>
                <MyText style={tw`text-2xl font-bold text-gray-800 dark:text-white`}>{user.name}</MyText>
                <TouchableOpacity 
                  style={tw`ml-2`}
                  onPress={() => router.push('/(drawer)/my-profile/edit' as any)}
                >
                  <Ionicons name="pencil" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="person-circle" size={16} color="#6b7280" />
                <MyText style={tw`text-gray-600 dark:text-gray-400 ml-1`}>{getUserType()}</MyText>
              </View>
              
              <MyText style={tw`text-gray-500 dark:text-gray-400 text-center mb-4`}>{user.email}</MyText>
              
              <View style={tw`flex-row justify-center mb-6`}>
                <TouchableOpacity 
                  style={tw`bg-blue-500 px-6 py-2 rounded-full`}
                  onPress={() => router.push(getUserDashboardRoute() as any)}
                >
                  <MyText style={tw`text-white font-medium`}>My Dashboard</MyText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
      
      {/* User Details Section */}
      {user && (
        <View style={tw`mt-6 px-4`}>
          <View style={tw`bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white`}>Personal Information</MyText>
              <TouchableOpacity onPress={() => setShowAllInfo(!showAllInfo)}>
                <Ionicons 
                  name={showAllInfo ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={tw`gap-3`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3`}>
                  <Ionicons name="call" size={18} color="#3b82f6" />
                </View>
                <View>
                  <MyText style={tw`text-gray-500 dark:text-gray-400 text-xs`}>Mobile</MyText>
                  <MyText style={tw`text-gray-800 dark:text-white`}>{user.mobile}</MyText>
                </View>
              </View>
              
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3`}>
                  <Ionicons name="id-card" size={18} color="#10b981" />
                </View>
                <View>
                  <MyText style={tw`text-gray-500 dark:text-gray-400 text-xs`}>User ID</MyText>
                  <MyText style={tw`text-gray-800 dark:text-white`}>{user.id}</MyText>
                </View>
              </View>
              
              {showAllInfo && (
                <>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3`}>
                      <Ionicons name="calendar" size={18} color="#8b5cf6" />
                    </View>
                    <View>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 text-xs`}>Member Since</MyText>
                      <MyText style={tw`text-gray-800 dark:text-white`}>
                        {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                      </MyText>
                    </View>
                  </View>
                  
                  {user.address && (
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg mr-3`}>
                        <Ionicons name="location" size={18} color="#f59e0b" />
                      </View>
                      <View>
                        <MyText style={tw`text-gray-500 dark:text-gray-400 text-xs`}>Address</MyText>
                        <MyText style={tw`text-gray-800 dark:text-white`}>{user.address}</MyText>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={tw`bg-white dark:bg-gray-800 rounded-2xl shadow p-4`}>
            <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white mb-3`}>Quick Actions</MyText>
            
            <View style={tw`gap-3`}>
              <TouchableOpacity 
                style={tw`flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg`}
                onPress={() => router.push('/(drawer)/my-tokens/upcoming' as any)}
              >
                <View style={tw`bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3`}>
                  <Ionicons name="calendar" size={18} color="#3b82f6" />
                </View>
                <MyText style={tw`text-gray-800 dark:text-white flex-1`}>My Appointments</MyText>
                <Ionicons name="chevron-forward" size={18} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={tw`flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg`}
                onPress={() => router.push('/(drawer)/my-profile/edit' as any)}
              >
                <View style={tw`bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3`}>
                  <Ionicons name="settings" size={18} color="#10b981" />
                </View>
                <MyText style={tw`text-gray-800 dark:text-white flex-1`}>Edit Profile</MyText>
                <Ionicons name="chevron-forward" size={18} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={tw`flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg`}
                onPress={handleLogout}
              >
                <View style={tw`bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-3`}>
                  <Ionicons name="log-out" size={18} color="#ef4444" />
                </View>
                <MyText style={tw`text-red-600 dark:text-red-400 flex-1`}>Logout</MyText>
                <Ionicons name="chevron-forward" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}