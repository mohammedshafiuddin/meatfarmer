import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ImageCarousel, tw } from 'common-ui';

const productDetail = {
  productName: 'Fresh Organic Apples',
  shortDescription: 'Crisp and juicy organic apples sourced from local farms.',
  longDescription: 'These fresh organic apples are hand-picked from sustainable farms, ensuring the highest quality and taste. Perfect for snacking, baking, or adding to your favorite recipes. Rich in vitamins and antioxidants, they promote healthy living.',
  productImages: [
    'https://picsum.photos/400/300?random=1',
    'https://picsum.photos/400/300?random=2',
    'https://picsum.photos/400/300?random=3',
  ],
  price: 120,
  unit: 'kg',
  deliveryTimings: [
    { deliveryTime: '9 AM - 12 PM', freezeTime: 'Freeze at 2°C' },
    { deliveryTime: '2 PM - 5 PM', freezeTime: 'Freeze at 4°C' },
  ],
  specialPackageDeals: [
    { quantity: 2, price: 220 },
    { quantity: 5, price: 500 },
    { quantity: 10, price: 1000 },
  ],
};

export default function ProductDetail() {
  const router = useRouter();

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold mb-2`}>{productDetail.productName}</Text>
        <Text style={tw`text-base text-gray-600 mb-4`}>{productDetail.shortDescription}</Text>

        <ImageCarousel urls={productDetail.productImages} imageHeight={250} />

        <Text style={tw`text-lg font-semibold mt-4 mb-2`}>Price: ₹{productDetail.price} per {productDetail.unit}</Text>

        <Text style={tw`text-lg font-semibold mb-2`}>Delivery Timings:</Text>
        {productDetail.deliveryTimings.map((timing, index) => (
          <View key={index} style={tw`mb-2`}>
            <Text style={tw`text-base`}>Delivery: {timing.deliveryTime}</Text>
            <Text style={tw`text-sm text-gray-500`}>Freeze: {timing.freezeTime}</Text>
          </View>
        ))}

        <View style={tw`flex-row justify-between mb-4`}>
          <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 mr-2 items-center`} onPress={() => router.push('/(drawer)/my-cart')}>
            <Text style={tw`text-white text-base font-bold`}>Buy Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 ml-2 items-center`}>
            <Text style={tw`text-white text-base font-bold`}>Add to Cart</Text>
          </TouchableOpacity>
        </View>

        <Text style={tw`text-lg font-semibold mb-2`}>Description:</Text>
        <Text style={tw`text-base mb-4`}>{productDetail.longDescription}</Text>

        <Text style={tw`text-lg font-semibold mb-2`}>Special Package Deals:</Text>
        {productDetail.specialPackageDeals.map((deal, index) => (
          <View key={index} style={tw`flex-row justify-between items-center p-2 bg-gray-100 rounded mb-2`}>
            <Text style={tw`text-base`}>{deal.quantity} {productDetail.unit}</Text>
            <Text style={tw`text-base font-bold`}>₹{deal.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}