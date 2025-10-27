  import React, { useState } from 'react';
  import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
  import { useRouter, useLocalSearchParams } from 'expo-router';
import { ImageCarousel, tw, BottomDialog, useManualRefresh } from 'common-ui';
import { theme } from 'common-ui/src/theme';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
  import { useGetProductDetails } from '@/src/api-hooks/product.api';
  import { useAddToCart } from '@/src/api-hooks/cart.api';
  import CustomHeader from '@/components/CustomHeader';
  //  import { useGetProductDetails } from '../../src/api-hooks/product.api';

  const { width: screenWidth } = Dimensions.get("window");
  const carouselWidth = screenWidth * 0.85;
  const carouselHeight = carouselWidth * (9 / 16); // 16:9 aspect ratio

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

    const handleBuyNow = (productId: number) => {
      addToCart.mutate({ productId, quantity: 1 }, {
        onSuccess: () => {
          router.push(`/my-cart?select=${productId}`);
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
    <View style={tw`flex-1 bg-white`}>
      <CustomHeader />
      <ScrollView style={tw`flex-1`}>
        <View style={tw`p-4`}>
        <View style={tw`items-center`}>
          <ImageCarousel urls={productDetail.images} imageWidth={carouselWidth} imageHeight={carouselHeight} showPaginationDots={true} />
        </View>

        <Text style={tw`text-2xl font-semibold mt-4 pl-2`}>{productDetail.name}</Text>
        <Text style={tw`text-base text-black mb-4 pl-2`}>{productDetail.shortDescription}</Text>

        <View style={tw`flex-row items-center mb-2 pl-2`}>
          <Text style={tw`text-lg text-gray-500 line-through mr-2`}>₹1000</Text>
          <Text style={tw`text-lg font-medium`}>₹{productDetail.price} per {productDetail.unit}</Text>
        </View>

        <Text style={tw`text-lg font-semibold mt-4 pl-2`}>Delivery Slots:</Text>
        {productDetail.deliverySlots.length === 0 ? (
          <Text style={tw`text-base text-gray-400 mb-6 pl-2`}>No slots available currently</Text>
        ) : (
          <>
            {productDetail.deliverySlots.slice(0, 2).map((slot, index) => (
              <View key={index} style={tw`flex-row items-center mb-6 pl-2`}>
                <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
                <View style={tw`ml-2`}>
                  <Text style={tw`text-base`}>Delivery: {dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a')}</Text>
                  <Text style={tw`text-sm text-gray-500`}>Freeze by: {dayjs(slot.freezeTime).format('ddd DD MMM, h:mm a')}</Text>
                </View>
              </View>
            ))}
            {productDetail.deliverySlots.length > 2 && (
              <TouchableOpacity onPress={() => setShowAllSlots(true)}>
                <Text style={tw`text-sm text-blue-500 pl-2`}>Show All ({productDetail.deliverySlots.length} slots)</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={tw`flex-row justify-between mb-4`}>
            <TouchableOpacity
              style={[tw`p-3 rounded-md flex-1 mr-2 items-center`, {
                backgroundColor: (productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) ? '#9ca3af' : theme.colors.pink1
              }]}
              onPress={() => !(productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) && handleBuyNow(productDetail.id)}
              disabled={productDetail.isOutOfStock || productDetail.deliverySlots.length === 0}
            >
              <Text style={tw`text-white text-base font-bold`}>
                {productDetail.isOutOfStock ? 'Out of Stock' :
                 productDetail.deliverySlots.length === 0 ? 'No Delivery Slots' :
                 'Buy Now'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tw`p-3 rounded-md flex-1 ml-2 items-center`, {
                backgroundColor: productDetail.isOutOfStock ? '#9ca3af' : theme.colors.pink1
              }]}
              onPress={() => !productDetail.isOutOfStock && handleAddToCart(productDetail.id)}
              disabled={productDetail.isOutOfStock}
            >
              <Text style={tw`text-white text-base font-bold`}>{productDetail.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</Text>
            </TouchableOpacity>
        </View>

        <Text style={tw`text-lg font-semibold mb-2 pl-2`}>Description:</Text>
        {!productDetail.longDescription ? (
          <Text style={tw`text-base text-gray-500 mb-4 pl-2 italic`}>
            Extended Description currently un-available for this product
          </Text>
        ) : (
          <Text style={tw`text-base mb-4 pl-2`}>{productDetail.longDescription}</Text>
        )}

        {productDetail.specialPackageDeals && productDetail.specialPackageDeals.length > 0 && (
          <>
            <Text style={tw`text-lg font-semibold mb-2 pl-2`}>Special Package Deals:</Text>
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
    </View>
  );
}