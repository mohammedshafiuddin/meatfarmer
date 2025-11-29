import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';

export default function UserDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: userData, isLoading, error, refetch } = trpc.admin.staffUser.getUserDetails.useQuery(
    { userId: id ? parseInt(id) : 0 },
    { enabled: !!id }
  );

  const updateSuspensionMutation = trpc.admin.staffUser.updateUserSuspension.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'User suspension status updated');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update suspension');
    },
  });

  const handleToggleSuspension = () => {
    if (!userData) return;
    const newStatus = !userData.isSuspended;
    updateSuspensionMutation.mutate({
      userId: userData.id,
      isSuspended: newStatus,
    });
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-500`}>Loading user details...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error || !userData) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <MyText style={tw`text-gray-900 text-xl font-bold mt-4 mb-2`}>
            Error
          </MyText>
          <MyText style={tw`text-gray-500 text-center`}>
            {error?.message || "Failed to load user details"}
          </MyText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mt-6 bg-gray-900 px-6 py-3 rounded-xl`}
          >
            <MyText style={tw`text-white font-bold`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  const user = userData;

  return (
    <AppContainer>
      <View style={tw`flex-1 bg-gray-50`}>
        {/* User Info */}
        <View style={tw`p-4`}>
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4`}>
            <View style={tw`flex-row items-center mb-6`}>
              <View style={tw`w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4`}>
                <MaterialIcons name="person" size={32} color="#3B82F6" />
              </View>
              <View>
                <MyText style={tw`text-2xl font-bold text-gray-900`}>{user.name || 'n/a'}</MyText>
                <MyText style={tw`text-sm text-gray-500`}>User ID: {user.id}</MyText>
              </View>
            </View>

            <View style={tw`space-y-4`}>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="phone" size={20} color="#6B7280" style={tw`mr-3 w-5`} />
                <MyText style={tw`text-gray-700`}>{user.mobile}</MyText>
              </View>

              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="email" size={20} color="#6B7280" style={tw`mr-3 w-5`} />
                <MyText style={tw`text-gray-700`}>{user.email}</MyText>
              </View>

              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="calendar-today" size={20} color="#6B7280" style={tw`mr-3 w-5`} />
                <MyText style={tw`text-gray-700`}>
                  Added on {dayjs(user.addedOn).format('MMM DD, YYYY')}
                </MyText>
              </View>

              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="shopping-cart" size={20} color="#6B7280" style={tw`mr-3 w-5`} />
                <MyText style={tw`text-gray-700`}>
                  {user.lastOrdered
                    ? `Last ordered ${dayjs(user.lastOrdered).format('MMM DD, YYYY')}`
                    : 'No orders yet'
                  }
                </MyText>
              </View>
            </View>
          </View>

          {/* Suspension Status */}
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons
                  name={user.isSuspended ? "block" : "check-circle"}
                  size={24}
                  color={user.isSuspended ? "#EF4444" : "#10B981"}
                  style={tw`mr-3`}
                />
                <View>
                  <MyText style={tw`font-semibold text-gray-900`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </MyText>
                  <MyText style={tw`text-sm text-gray-500`}>
                    {user.isSuspended ? 'User is suspended' : 'User is active'}
                  </MyText>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleToggleSuspension}
                disabled={updateSuspensionMutation.isPending}
                style={tw`px-4 py-2 rounded-lg ${
                  user.isSuspended ? 'bg-green-500' : 'bg-red-500'
                } ${updateSuspensionMutation.isPending ? 'opacity-50' : ''}`}
              >
                <MyText style={tw`text-white font-semibold text-sm`}>
                  {updateSuspensionMutation.isPending
                    ? 'Updating...'
                    : user.isSuspended
                    ? 'Revoke Suspension'
                    : 'Suspend User'
                  }
                </MyText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </AppContainer>
  );
}