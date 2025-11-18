import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, AppContainer, MyText, useMarkDataFetchers } from 'common-ui';
import { MaterialIcons } from '@expo/vector-icons';
import { trpc } from '@/src/trpc-client';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const productId = parseInt(id as string);

  const { data: productData, isLoading, error, refetch } = trpc.admin.product.getProductById.useQuery({id: productId});

  useMarkDataFetchers(() => {
    refetch();
  });
  const deleteProduct = trpc.admin.product.deleteProduct.useMutation();
  const toggleOutOfStock = trpc.admin.product.toggleOutOfStock.useMutation();

  const product = productData?.product;

  const handleEdit = () => {
    router.push(`/edit-product?id=${productId}` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct.mutate({id: productId}, {
              onSuccess: () => {
                Alert.alert('Success', 'Product deleted successfully');
                router.back();
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to delete product');
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error || !product) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading product</MyText>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ScrollView style={tw`flex-1`}>
        <View style={tw`p-4`}>
          {/* Header with Edit and Delete buttons */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
             <MyText style={tw`text-2xl font-bold text-gray-800`}>{product.name}</MyText>
             <View style={tw`flex-row`}>
               <TouchableOpacity onPress={handleEdit} style={tw`mr-2 p-2 bg-blue-500 rounded-lg shadow-md`}>
                 <MaterialIcons name="edit" size={20} color="white" />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleDelete} style={tw`p-2 bg-red-500 rounded-lg shadow-md`}>
                 <MaterialIcons name="delete" size={20} color="white" />
               </TouchableOpacity>
             </View>
           </View>

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <ScrollView horizontal style={tw`mb-4`}>
              {product.images.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={tw`w-32 h-32 rounded mr-2`} />
              ))}
            </ScrollView>
          )}

          {/* Product Info */}
           <MyText style={tw`text-lg font-semibold mb-2 text-gray-800`}>Price: ₹{product.price}</MyText>
           {product.marketPrice && (
             <MyText style={tw`text-lg font-semibold mb-2 text-gray-600`}>Market Price: ₹{product.marketPrice}</MyText>
           )}
           <MyText style={tw`text-lg font-semibold mb-2 text-gray-800`}>Unit: {product.unit?.shortNotation}</MyText>
           <View style={tw`flex-row items-center mb-2`}>
             <MyText style={tw`text-lg font-semibold mr-4 ${product.isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
               Status: {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
             </MyText>
             <TouchableOpacity
               onPress={() => {
                 toggleOutOfStock.mutate({id: productId}, {
                   onSuccess: () => {
                     Alert.alert('Success', 'Stock status updated');
                   },
                   onError: (error: any) => {
                     Alert.alert('Error', error.message || 'Failed to update stock status');
                   },
                 });
               }}
               disabled={toggleOutOfStock.isPending}
             >
               <MyText style={tw`text-sm ${product.isOutOfStock ? 'text-green-500' : 'text-blue-500'} underline font-semibold`}>
                 {product.isOutOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
               </MyText>
             </TouchableOpacity>
           </View>

           {product.shortDescription && (
             <MyText style={tw`text-base mb-2 text-gray-700`}>{product.shortDescription}</MyText>
           )}

           {product.longDescription && (
             <MyText style={tw`text-lg font-semibold mb-2 text-gray-800`}>Description:</MyText>
           )}
           {product.longDescription && (
             <MyText style={tw`text-base mb-4 text-gray-700`}>{product.longDescription}</MyText>
           )}

          {/* Special Deals */}
           {product.deals && product.deals.length > 0 && (
             <>
               <MyText style={tw`text-lg font-semibold mb-2 text-gray-800`}>Special Package Deals:</MyText>
               {product.deals.map((deal, index) => (
                 <View key={index} style={tw`mb-2 p-3 bg-gray-50 rounded-lg`}>
                   <MyText style={tw`text-gray-700`}>Quantity: {deal.quantity}</MyText>
                   <MyText style={tw`text-gray-700`}>Price: ₹{deal.price}</MyText>
                   <MyText style={tw`text-gray-700`}>Valid Till: {new Date(deal.validTill).toLocaleDateString()}</MyText>
                 </View>
               ))}
             </>
           )}
        </View>
      </ScrollView>
    </AppContainer>
  );
}