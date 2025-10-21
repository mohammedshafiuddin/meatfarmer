import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { tw } from 'common-ui';
import { useGetComplaints, useResolveComplaint } from '../../../src/api-hooks/complaint.api';
import { usePagination } from '../../../hooks/usePagination';
import { AppContainer } from 'common-ui';

export default function Complaints() {
  const { currentPage, pageSize, PaginationComponent } = usePagination(5); // 5 complaints per page for testing

  const { data, isLoading, error } = useGetComplaints({ page: currentPage, limit: pageSize });
  const resolveComplaint = useResolveComplaint();

  const complaints = data?.complaints || [];
  const totalCount = data?.totalCount || 0;

  const handleMarkResolved = (id: number) => {
    Alert.alert('Mark as Resolved', 'Are you sure you want to mark this complaint as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () => {
          resolveComplaint.mutate(id, {
            onSuccess: () => {
              Alert.alert('Success', 'Complaint marked as resolved');
            },
            onError: (error: any) => {
              Alert.alert('Error', error.message || 'Failed to resolve complaint');
            },
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <AppContainer>
        <Text>Loading complaints...</Text>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <Text>Error loading complaints</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={tw`bg-white p-4 mb-2 rounded-lg shadow`}>
            <Text style={tw`text-lg font-bold mb-2`}>Complaint #{item.id}</Text>
            <Text style={tw`text-base mb-2`}>{item.text}</Text>
            <View style={tw`flex-row items-center mb-2`}>
              <TouchableOpacity onPress={() => Alert.alert('User Page', 'User page coming soon')}>
                <Text style={tw`text-sm text-blue-600 underline`}>{item.userName}</Text>
              </TouchableOpacity>
              <Text style={tw`text-sm text-gray-600 mx-2`}>|</Text>
              {item.orderId && (
                <TouchableOpacity onPress={() => Alert.alert('Order Page', 'Order page coming soon')}>
                  <Text style={tw`text-sm text-blue-600 underline`}>Order #{item.orderId}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={tw`text-sm ${item.status === 'resolved' ? 'text-green-600' : 'text-red-600'}`}>
              Status: {item.status}
            </Text>
            {item.status === 'pending' && (
              <TouchableOpacity
                onPress={() => handleMarkResolved(item.id)}
                style={tw`mt-2 bg-blue-500 p-2 rounded`}
              >
                <Text style={tw`text-white text-center`}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-10`}>
            <Text style={tw`text-gray-500`}>No complaints found</Text>
          </View>
        }
      />
      <PaginationComponent totalCount={totalCount} />
    </AppContainer>
  );
}