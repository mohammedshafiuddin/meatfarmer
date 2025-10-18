import React from 'react';
import { View, Dimensions, FlatList, Image, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ImageCarousel, tw } from 'common-ui';

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth * 0.8;
const imageHeight = imageWidth * 9 / 16;

const demoImages = [
  'https://picsum.photos/800/400?random=1',
  'https://picsum.photos/800/400?random=2',
  'https://picsum.photos/800/400?random=3',
];

const products = [
  { name: 'Product 1', images: ['https://picsum.photos/200/200?random=1'], price: 10, unit: 'kg', deliveryTimings: ['9 AM', '5 PM'] },
  { name: 'Product 2', images: ['https://picsum.photos/200/200?random=2'], price: 15, unit: 'kg', deliveryTimings: ['10 AM', '6 PM'] },
  { name: 'Product 3', images: ['https://picsum.photos/200/200?random=3'], price: 20, unit: 'kg', deliveryTimings: ['8 AM', '4 PM'] },
  { name: 'Product 4', images: ['https://picsum.photos/200/200?random=4'], price: 25, unit: 'kg', deliveryTimings: ['9 AM', '5 PM'] },
  { name: 'Product 5', images: ['https://picsum.photos/200/200?random=5'], price: 30, unit: 'kg', deliveryTimings: ['10 AM', '6 PM'] },
  { name: 'Product 6', images: ['https://picsum.photos/200/200?random=6'], price: 35, unit: 'kg', deliveryTimings: ['8 AM', '4 PM'] },
  { name: 'Product 7', images: ['https://picsum.photos/200/200?random=7'], price: 40, unit: 'kg', deliveryTimings: ['9 AM', '5 PM'] },
  { name: 'Product 8', images: ['https://picsum.photos/200/200?random=8'], price: 45, unit: 'kg', deliveryTimings: ['10 AM', '6 PM'] },
  { name: 'Product 9', images: ['https://picsum.photos/200/200?random=9'], price: 50, unit: 'kg', deliveryTimings: ['8 AM', '4 PM'] },
  { name: 'Product 10', images: ['https://picsum.photos/200/200?random=10'], price: 55, unit: 'kg', deliveryTimings: ['9 AM', '5 PM'] },
  { name: 'Product 11', images: ['https://picsum.photos/200/200?random=11'], price: 60, unit: 'kg', deliveryTimings: ['10 AM', '6 PM'] },
  { name: 'Product 12', images: ['https://picsum.photos/200/200?random=12'], price: 65, unit: 'kg', deliveryTimings: ['8 AM', '4 PM'] },
];

const renderProduct = ({ item, router }: { item: typeof products[0], router: any }) => (
  <TouchableOpacity style={tw`flex-1 m-2.5 bg-gray-100 rounded-lg p-2.5 items-center`} onPress={() => router.push('/product-detail')}>
    <Image source={{ uri: item.images[0] }} style={tw`w-25 h-25 rounded-lg`} />
    <Text style={tw`text-base font-bold mt-2`}>{item.name}</Text>
    <Text style={tw`text-sm text-gray-600 mt-1`}>₹{item.price} per {item.unit}</Text>
    <Text style={tw`text-xs text-gray-500 mt-1`}>Delivery: {item.deliveryTimings[0]} & {item.deliveryTimings[1]}</Text>
    <View style={tw`flex-col mt-2 w-full`}>
      <TouchableOpacity style={tw`bg-indigo-600 p-2 rounded-md my-1 items-center`}>
        <Text style={tw`text-white text-sm font-bold`}>Buy Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-indigo-600 p-2 rounded-md my-1 items-center`}>
        <Text style={tw`text-white text-sm font-bold`}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={tw`flex-1`}>
      <View style={tw`items-center mb-5`}>
        <ImageCarousel urls={demoImages} imageWidth={imageWidth} imageHeight={imageHeight} />
      </View>
      <FlatList
        data={products}
        numColumns={2}
        renderItem={({ item }) => renderProduct({ item, router })}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={tw`px-2.5`}
      />
    </View>
  );
}

