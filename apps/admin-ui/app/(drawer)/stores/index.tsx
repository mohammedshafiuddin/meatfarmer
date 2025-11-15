import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MyText, tw, MyButton } from 'common-ui';
import MyFlatList from 'common-ui/src/components/flat-list';
import { trpc } from '@/src/trpc-client';

export default function Stores() {
  const router = useRouter();

  const { data: storesData, isLoading, error, refetch } = trpc.admin.store.getStores.useQuery();

  const stores = storesData?.stores || [];

  const handleEdit = (storeId: number) => {
    router.push(`/edit-store?id=${storeId}` as any);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={tw`flex-row justify-between items-center p-4 bg-white rounded-lg mb-2 shadow-sm`}>
      <MyText style={tw`text-lg font-semibold`}>{item.name}</MyText>
      <TouchableOpacity onPress={() => handleEdit(item.id)}>
        <MaterialIcons name="edit" size={24} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <MyText style={tw`text-gray-600`}>Loading stores...</MyText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <MyText style={tw`text-red-600`}>Error loading stores</MyText>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 p-4 bg-white`}>
      <MyFlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <MyText style={tw`text-2xl font-bold text-gray-800`}>Stores</MyText>
            <MyButton onPress={() => router.push('/add-store' as any)}>
              Add New
            </MyButton>
          </View>
        }
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center`}>
            <MyText style={tw`text-gray-500`}>No stores found</MyText>
          </View>
        }
      />
    </View>
  );
}