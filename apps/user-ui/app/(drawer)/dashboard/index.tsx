import React from "react";
import {
  View,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
 import { ImageCarousel, tw, useManualRefresh } from "common-ui";
   import { useGetAllProductsSummary } from "common-ui/src/common-api-hooks/product.api";
  //  import { useAddToCart } from "../../src/api-hooks/cart.api";
  import dayjs from "dayjs";
  import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAddToCart } from "@/src/api-hooks/cart.api";

const { width: screenWidth } = Dimensions.get("window");
const imageWidth = screenWidth * 0.8;
const imageHeight = (imageWidth * 9) / 16;
const itemWidth = (screenWidth - 40) / 2; // 40px for px-5 padding (20px each side)

const demoImages = [
  "https://picsum.photos/800/400?random=1",
  "https://picsum.photos/800/400?random=2",
  "https://picsum.photos/800/400?random=3",
];

const renderProduct = ({ item, router, handleAddToCart }: { item: any; router: any; handleAddToCart: any }) => {
  
  return (
    <TouchableOpacity
      style={[tw`bg-gray-100 rounded-lg p-2.5 items-center`, { width: itemWidth }]}
      onPress={() => router.push(`/product-detail/${item.id}`)}
    >
       <Image
         source={{ uri: item.images?.[0] }}
         style={tw`w-25 h-25 rounded-lg`}
       />
      <Text style={tw`text-base font-bold mt-2`} numberOfLines={1}>
        {item.name}
      </Text>
       <Text style={tw`text-sm text-gray-600 mt-1`}>
         ₹{item.price} per {item.unit || "unit"}
       </Text>
        {item.nextDeliveryDate && (
          <View style={tw`flex-row items-center mt-1`}>
            <MaterialIcons name="local-shipping" size={12} color="#6b7280" />
            <Text style={tw`text-xs text-gray-500 ml-1`}>
              {dayjs(item.nextDeliveryDate).format('ddd DD MMM, h a')}
            </Text>
          </View>
        )}
       <View style={tw`flex-col mt-2 w-full`}>
        <TouchableOpacity
          style={tw`bg-indigo-600 p-2 rounded-md my-1 items-center`}
        >
          <Text style={tw`text-white text-sm font-bold`}>Buy Now</Text>
        </TouchableOpacity>
         <TouchableOpacity
           style={tw`bg-indigo-600 p-2 rounded-md my-1 items-center`}
           onPress={() => handleAddToCart(item.id)}
         >
           <Text style={tw`text-white text-sm font-bold`}>Add to Cart</Text>
         </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

  export default function Dashboard() {
    const router = useRouter();
    const { data: productsData, isLoading, error, refetch } = useGetAllProductsSummary();
    const products = productsData?.products || [];
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
        <Text>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Error loading products</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* <View style={tw`items-center mb-5`}>
        <ImageCarousel
          urls={demoImages}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
      </View> */}
      <FlatList
        data={products}
        numColumns={2}
         renderItem={({ item }) => renderProduct({ item, router, handleAddToCart })}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={tw`px-5`}
      />
    </View>
  );
}
