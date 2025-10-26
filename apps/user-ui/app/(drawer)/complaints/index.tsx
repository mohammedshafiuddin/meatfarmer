import React from 'react';
import { View, FlatList } from 'react-native';
import { AppContainer, MyText, tw, useManualRefresh } from 'common-ui';
import { trpc } from '@/src/trpc-client';

export default function Complaints() {
  const { data, isLoading, error, refetch } = trpc.user.complaint.getAll.useQuery();
  const complaints = data?.complaints || [];

  useManualRefresh(() => refetch());

  if (isLoading) {
    return (
      <AppContainer>
        <MyText style={tw`text-center mt-8`}>Loading complaints...</MyText>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <MyText style={tw`text-center mt-8 text-red-500`}>Error loading complaints</MyText>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <View style={tw`flex-1 p-4`}>


        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={tw`bg-white p-4 mb-4 rounded-lg shadow`}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <MyText style={tw`text-lg font-semibold`}>Complaint #{item.id}</MyText>
                <View style={tw`px-2 py-1 rounded ${
                  item.isResolved ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <MyText style={tw`text-sm ${
                    item.isResolved ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {item.isResolved ? 'Resolved' : 'Pending'}
                  </MyText>
                </View>
              </View>

              <MyText style={tw`text-base mb-3 text-gray-700`}>
                {item.complaintBody}
              </MyText>

              {item.orderId && (
                <MyText style={tw`text-sm text-gray-500 mb-2`}>
                  Related to Order #{item.orderId}
                </MyText>
              )}

              {item.response && (
                <View style={tw`bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500`}>
                  <MyText style={tw`text-sm font-semibold text-blue-800 mb-1`}>
                    Admin Response:
                  </MyText>
                  <MyText style={tw`text-sm text-blue-700`}>
                    {item.response}
                  </MyText>
                </View>
              )}

              <MyText style={tw`text-xs text-gray-400 mt-2`}>
                {new Date(item.createdAt).toLocaleDateString()}
              </MyText>
            </View>
          )}
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center py-10`}>
              <MyText style={tw`text-gray-500 text-center`}>No complaints found</MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>
                You haven't raised any complaints yet
              </MyText>
            </View>
          }
        />
      </View>
    </AppContainer>
  );
}