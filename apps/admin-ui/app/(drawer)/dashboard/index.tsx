 import React from 'react';
 import { View, Dimensions, FlatList, Image, Text, TouchableOpacity, Alert } from 'react-native';
 import { useRouter } from 'expo-router';
 import { tw, useManualRefresh } from 'common-ui';
 import { useGetProducts } from '../../../src/api-hooks/product.api';
 import useFocusCallback from 'common-ui/hooks/useFocusCallback';

const { width: screenWidth } = Dimensions.get('window');

const renderProduct = ({ item, router }: { item: any, router: any }) => (
  <TouchableOpacity
    style={tw`flex-1 m-2.5 bg-gray-100 rounded-lg p-2.5 items-center`}
    onPress={() => Alert.alert('Edit Product', `Navigate to edit product ${item.id}`)}
  >
    <Image
      source={{ uri: item.images?.[0] || 'https://picsum.photos/200/200?random=default' }}
      style={tw`w-25 h-25 rounded-lg`}
    />
    <Text style={tw`text-base font-bold mt-2`} numberOfLines={1}>{item.name}</Text>
    <Text style={tw`text-sm text-gray-600 mt-1`}>₹{item.price} per {item.unit?.shortNotation || 'unit'}</Text>
    <View style={tw`flex-col mt-2 w-full`}>
      <TouchableOpacity
        style={tw`bg-blue-600 p-2 rounded-md my-1 items-center`}
        onPress={() => router.push(`/edit-product?id=${item.id}`)}
      >
        <Text style={tw`text-white text-sm font-bold`}>Edit</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

 export default function Dashboard() {
   const router = useRouter();
   const { data: productsData, isLoading, error, refetch } = useGetProducts();

  useManualRefresh(refetch);

  const products = productsData?.products || [];

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
        <Text>Error loading products</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50 p-4`}>
      <FlatList
        data={products}
        numColumns={2}
        renderItem={({ item }) => renderProduct({ item, router })}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={tw`pb-4`}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-10`}>
            <Text style={tw`text-gray-500`}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}