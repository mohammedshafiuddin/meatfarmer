import React from 'react';
import { View } from 'react-native';
import { MyText, tw, useManualRefresh, MyFlatList, useMarkDataFetchers } from 'common-ui';
import { MaterialIcons } from '@expo/vector-icons';
import { trpc } from '@/src/trpc-client';

export default function Complaints() {
  const { data, isLoading, error, refetch } = trpc.user.complaint.getAll.useQuery();
  const complaints = data?.complaints || [];

  useManualRefresh(() => refetch());

  useMarkDataFetchers(() => {
    refetch();
  });

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <MyText style={tw`text-center mt-8`}>Loading complaints...</MyText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <MyText style={tw`text-center mt-8 text-red-500`}>Error loading complaints</MyText>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>


      <MyFlatList
        style={tw`flex-1 bg-white`}
        contentContainerStyle={tw`px-4 pb-6`}
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}>
              <View style={tw`flex-row justify-between items-start mb-4`}>
                <View>
                  <MyText style={tw`text-lg font-bold text-gray-800`}>Complaint #{item.id}</MyText>
                  <MyText style={tw`text-sm text-gray-500 mt-1`}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </MyText>
                </View>

                <View style={tw`flex-row items-center px-3 py-1 rounded-full ${
                  item.isResolved ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <MaterialIcons
                    name={item.isResolved ? 'check-circle' : 'schedule'}
                    size={14}
                    color={item.isResolved ? '#16A34A' : '#D97706'}
                  />
                  <MyText style={tw`text-xs font-semibold ml-1 ${
                    item.isResolved ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {item.isResolved ? 'Resolved' : 'Pending'}
                  </MyText>
                </View>
              </View>

              <MyText style={tw`text-base mb-4 text-gray-700 leading-6`}>
                {item.complaintBody}
              </MyText>

              {item.orderId && (
                <View style={tw`flex-row items-center mb-4`}>
                  <MaterialIcons name="shopping-bag" size={16} color="#6B7280" />
                  <MyText style={tw`text-sm text-gray-600 ml-2`}>
                    Related to Order #{item.orderId}
                  </MyText>
                </View>
              )}

              {item.response && (
                <View style={tw`bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <MaterialIcons name="admin-panel-settings" size={16} color="#2563EB" />
                    <MyText style={tw`text-sm font-semibold text-blue-800 ml-2`}>
                      Admin Response
                    </MyText>
                  </View>
                  <MyText style={tw`text-sm text-blue-700 leading-5`}>
                    {item.response}
                  </MyText>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center py-12`}>
              <MaterialIcons name="feedback" size={64} color="#D1D5DB" />
              <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>No complaints yet</MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>Your complaint history will appear here</MyText>
            </View>
          }
        />
    </View>
  );
}