import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, AppContainer } from 'common-ui';
import { useGetProduct, useDeleteProduct, useToggleOutOfStock } from '../../../src/api-hooks/product.api';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const productId = parseInt(id as string);

  const { data: productData, isLoading, error } = useGetProduct(productId);
  const deleteProduct = useDeleteProduct();
  const toggleOutOfStock = useToggleOutOfStock();

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
            deleteProduct.mutate(productId, {
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
        <Text>Loading...</Text>
      </AppContainer>
    );
  }

  if (error || !product) {
    return (
      <AppContainer>
        <Text>Error loading product</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ScrollView style={tw`flex-1`}>
        <View style={tw`p-4`}>
          {/* Header with Edit and Delete buttons */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-2xl font-bold`}>{product.name}</Text>
            <View style={tw`flex-row`}>
              <TouchableOpacity onPress={handleEdit} style={tw`mr-2 p-2 bg-blue-500 rounded`}>
                <MaterialIcons name="edit" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={tw`p-2 bg-red-500 rounded`}>
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
          <Text style={tw`text-lg font-semibold mb-2`}>Price: ₹{product.price}</Text>
          <Text style={tw`text-lg font-semibold mb-2`}>Unit: {product.unit?.shortNotation}</Text>
          <View style={tw`flex-row items-center mb-2`}>
            <Text style={tw`text-lg font-semibold mr-4 ${product.isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
              Status: {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                toggleOutOfStock.mutate(productId, {
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
              <Text style={tw`text-sm ${product.isOutOfStock ? 'text-green-500' : 'text-blue-500'} underline`}>
                {product.isOutOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>

          {product.shortDescription && (
            <Text style={tw`text-base mb-2`}>{product.shortDescription}</Text>
          )}

          {product.longDescription && (
            <Text style={tw`text-lg font-semibold mb-2`}>Description:</Text>
          )}
          {product.longDescription && (
            <Text style={tw`text-base mb-4`}>{product.longDescription}</Text>
          )}

          {/* Special Deals */}
          {product.deals && product.deals.length > 0 && (
            <>
              <Text style={tw`text-lg font-semibold mb-2`}>Special Package Deals:</Text>
              {product.deals.map((deal, index) => (
                <View key={index} style={tw`mb-2 p-2 bg-gray-100 rounded`}>
                  <Text>Quantity: {deal.quantity}</Text>
                  <Text>Price: ₹{deal.price}</Text>
                  <Text>Valid Till: {new Date(deal.validTill).toLocaleDateString()}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </AppContainer>
  );
}