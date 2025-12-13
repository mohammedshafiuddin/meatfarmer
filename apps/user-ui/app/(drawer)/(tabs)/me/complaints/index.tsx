import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MyText, tw, useManualRefresh, MyFlatList, useMarkDataFetchers, theme } from 'common-ui';
import { MaterialIcons } from '@expo/vector-icons';
import { trpc } from '@/src/trpc-client';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';

export default function Complaints() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = trpc.user.complaint.getAll.useQuery();
  const complaints = data?.complaints || [];

  useManualRefresh(() => refetch());

  useMarkDataFetchers(() => {
    refetch();
  });

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading complaints...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Failed to load complaints</Text>
      </View>
    );
  }

  const renderComplaintItem = ({ item }: { item: any }) => (
    <View style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100`}>
      {/* Header: ID, Date, Status */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-base font-bold text-gray-900`}>
              Complaint #{item.id}
            </Text>
            {item.orderId && (
              <View style={tw`bg-gray-100 px-2 py-0.5 rounded ml-2`}>
                <Text style={tw`text-[10px] font-bold text-gray-500`}>
                  Order #{item.orderId}
                </Text>
              </View>
            )}
          </View>
          <Text style={tw`text-xs text-gray-400 mt-1`}>
            {dayjs(item.createdAt).format('MMM DD, YYYY • h:mm A')}
          </Text>
        </View>

        <View style={tw`px-3 py-1 rounded-full ${item.isResolved ? 'bg-green-100' : 'bg-amber-100'
          }`}>
          <Text style={tw`text-xs font-bold ${item.isResolved ? 'text-green-700' : 'text-amber-700'
            }`}>
            {item.isResolved ? 'Resolved' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Complaint Body */}
      <Text style={tw`text-gray-700 text-sm leading-6 mb-4`}>
        {item.complaintBody}
      </Text>

      {/* Admin Response */}
      {item.response && (
        <View style={tw`bg-blue-50 p-4 rounded-xl border border-blue-100`}>
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-2`}>
              <MaterialIcons name="support-agent" size={14} color="#2563EB" />
            </View>
            <Text style={tw`text-xs font-bold text-blue-800 uppercase tracking-wide`}>
              Support Response
            </Text>
          </View>
          <Text style={tw`text-sm text-blue-900 leading-5`}>
            {item.response}
          </Text>
        </View>
      )}

      {!item.response && !item.isResolved && (
        <View style={tw`flex-row items-center mt-2`}>
          <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
          <Text style={tw`text-xs text-gray-400 ml-1 italic`}>
            We are reviewing your complaint...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComplaintItem}
        contentContainerStyle={tw`px-4 py-6`}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-20`}>
            <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6`}>
              <MaterialIcons name="thumb-up-off-alt" size={40} color="#9CA3AF" />
            </View>
            <Text style={tw`text-xl font-bold text-gray-900`}>No Complaints</Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10 leading-5`}>
              You haven't raised any complaints yet. That's great!
            </Text>
        <TouchableOpacity
          onPress={() => handleMarkResolved(item.id)}
          style={tw`mt-8 bg-brand500 px-6 py-3 rounded-xl shadow-sm`}
        >
              <Text style={tw`text-white font-bold`}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}