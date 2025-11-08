import React, { useState } from "react";
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
 import { ImageCarousel, theme, tw, useManualRefresh } from "common-ui";
    import { useGetAllProductsSummary } from "common-ui/src/common-api-hooks/product.api";
   import dayjs from "dayjs";
   import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAddToCart } from "@/src/api-hooks/cart.api";
import SearchBar from "common-ui/src/components/search-bar";
import { trpc } from "@/src/trpc-client";


const { width: screenWidth } = Dimensions.get("window");
const imageWidth = screenWidth * 0.8;
const imageHeight = (imageWidth * 9) / 16;
const itemWidth = (screenWidth - 40 - 20) / 2; // 40px for px-5 padding (20px each side), 20px for margins

const demoImages = [
  "https://picsum.photos/800/400?random=1",
  "https://picsum.photos/800/400?random=2",
  "https://picsum.photos/800/400?random=3",
];

const renderProduct = ({ item, router, handleAddToCart, handleBuyNow }: { item: any; router: any; handleAddToCart: any; handleBuyNow: any }) => {
  
  return (
     <TouchableOpacity
       style={[tw`bg-white rounded-lg items-center shadow-md mb-3 mr-2.5`, { width: itemWidth }]}
        onPress={() => router.push(`/product-detail?id=${item.id}`)}
     >
        <Image
          source={{ uri: item.images?.[0] }}
          style={[{ width: itemWidth, height: itemWidth }, tw`rounded-t-lg`]}
        />
        <View style={tw`p-2.5 w-full`}>
          <Text style={tw`text-base font-medium`} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={tw`text-sm text-black mt-1`}>
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
          {item.isOutOfStock ? (
            <View style={tw`mt-2 items-center`}>
              <Text style={[tw`text-sm font-medium`, { color: theme.colors.red1 }]}>
                Out of Stock
              </Text>
            </View>
          ) : (
            <View style={tw`flex-row mt-2 justify-end w-full`}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                }}
                onPress={() => handleBuyNow(item.id)}
              >
                <View style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.pink1,
                  opacity: 0.7,
                }} />
                <MaterialIcons name="flash-on" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => handleAddToCart(item.id)}
              >
                <View style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.pink1,
                  opacity: 0.7,
                }} />
                <MaterialIcons name="shopping-cart" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
     </TouchableOpacity>
  );
};

     export default function Dashboard() {
       const router = useRouter();
       // const { data: productsData, isLoading, error, refetch } = useGetAllProductsSummary();
       const [inputQuery, setInputQuery] = useState('');
       const [searchQuery, setSearchQuery] = useState('');
       const { data: productsData, isLoading, error, refetch } = trpc.common.product.getAllProductsSummary.useQuery({ searchQuery });
       console.log({error})
       
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
    <View style={tw`flex-1 bg-gray1`}>
       {/* <View style={tw`items-center mb-5`}>
         <ImageCarousel
           urls={demoImages}
           imageWidth={imageWidth}
           imageHeight={imageHeight}
         />
       </View> */}
         <View style={tw`px-5 pt-5 pb-3`}>
           <SearchBar
             value={inputQuery}
             onChangeText={setInputQuery}
             onSearch={() => setSearchQuery(inputQuery)}
             placeholder="Search products..."
             containerStyle={tw`mb-3`}
           />
           {searchQuery ? (
             <Text style={tw`text-lg font-semibold mb-2`}>Results for "{searchQuery}"</Text>
           ) : null}
         </View>
        <FlatList
          data={products}
          numColumns={2}
            renderItem={({ item }) => renderProduct({ item, router, handleAddToCart, handleBuyNow })}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={tw`px-5`}
        />
    </View>
  );
}
