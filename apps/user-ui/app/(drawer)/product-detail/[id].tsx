 import React, { useState } from 'react';
 import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
 import { useRouter, useLocalSearchParams } from 'expo-router';
 import { ImageCarousel, tw, BottomDialog, useManualRefresh } from 'common-ui';
 import dayjs from 'dayjs';
 import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useGetProductDetails } from '@/src/api-hooks/product.api';
import { useAddToCart } from '@/src/api-hooks/cart.api';
//  import { useGetProductDetails } from '../../src/api-hooks/product.api';


export default function ProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showAllSlots, setShowAllSlots] = useState(false);
  const { data: productDetail, isFetching:isLoading, error, refetch } = useGetProductDetails(Number(id));
  const addToCart = useAddToCart();

  useManualRefresh(() => {
    refetch();
  });

  const handleAddToCart = (productId: number) => {
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        Alert.alert('Success', 'Item added to cart!');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
    });
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Loading product details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Error loading product details</Text>
      </View>
    );
  }

  if (!productDetail) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold mb-2`}>{productDetail.name}</Text>
        <Text style={tw`text-base text-gray-600 mb-4`}>{productDetail.shortDescription}</Text>

        <ImageCarousel urls={productDetail.images} imageHeight={250} />

        <Text style={tw`text-lg font-semibold mt-4 mb-2`}>Price: ₹{productDetail.price} per {productDetail.unit}</Text>

        <Text style={tw`text-lg font-semibold mt-4`}>Delivery Slots:</Text>
        {productDetail.deliverySlots.slice(0, 2).map((slot, index) => (
          <View key={index} style={tw`flex-row items-center mb-6`}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <View style={tw`ml-2`}>
              <Text style={tw`text-base`}>Delivery: {dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a')}</Text>
              <Text style={tw`text-sm text-gray-500`}>Freeze by: {dayjs(slot.freezeTime).format('ddd DD MMM, h:mm a')}</Text>
            </View>
          </View>
        ))}
        {productDetail.deliverySlots.length > 2 && (
          <TouchableOpacity onPress={() => setShowAllSlots(true)}>
            <Text style={tw`text-sm text-blue-500`}>Show All ({productDetail.deliverySlots.length} slots)</Text>
          </TouchableOpacity>
        )}

        <View style={tw`flex-row justify-between mb-4`}>
          <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 mr-2 items-center`} onPress={() => router.push('/(drawer)/my-cart')}>
            <Text style={tw`text-white text-base font-bold`}>Buy Now</Text>
          </TouchableOpacity>
           <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 ml-2 items-center`} onPress={() => handleAddToCart(productDetail.id)}>
             <Text style={tw`text-white text-base font-bold`}>Add to Cart</Text>
           </TouchableOpacity>
        </View>

        <Text style={tw`text-lg font-semibold mb-2`}>Description:</Text>
        <Text style={tw`text-base mb-4`}>{productDetail.longDescription}</Text>

        {productDetail.specialPackageDeals && productDetail.specialPackageDeals.length > 0 && (
          <>
            <Text style={tw`text-lg font-semibold mb-2`}>Special Package Deals:</Text>
            {productDetail.specialPackageDeals.map((deal, index) => (
              <View key={index} style={tw`flex-row justify-between items-center p-2 bg-gray-100 rounded mb-2`}>
                <Text style={tw`text-base`}>{deal.quantity} {productDetail.unit}</Text>
                <Text style={tw`text-base font-bold`}>₹{deal.price}</Text>
              </View>
            ))}
          </>
        )}
      </View>
      <BottomDialog open={showAllSlots} onClose={() => setShowAllSlots(false)}>
        <ScrollView style={tw`max-h-96`}>
          <View style={tw`p-4`}>
            <Text style={tw`text-lg font-bold mb-4`}>All Delivery Slots</Text>
            {productDetail.deliverySlots.map((slot, index) => (
              <View key={index} style={tw`flex-row items-center mb-3`}>
                <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
                <View style={tw`ml-2`}>
                  <Text style={tw`text-base`}>Delivery: {dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a')}</Text>
                  <Text style={tw`text-sm text-gray-500`}>Freeze by: {dayjs(slot.freezeTime).format('ddd DD MMM, h:mm a')}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </BottomDialog>
    </ScrollView>
  );
}