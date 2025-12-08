import React, { useState } from 'react';
import {
  View,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, tw, useManualRefresh, MyFlatList, useDrawerTitle, useMarkDataFetchers, LoadingDialog } from 'common-ui';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { trpc } from '@/src/trpc-client';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 48) / 2; // 48 = padding horizontal (16*2) + gap (16)

const renderProduct = ({ item, router, handleAddToCart, handleBuyNow }: { item: any; router: any; handleAddToCart: any; handleBuyNow: any }) => {
  return (
    <TouchableOpacity
      style={[
        tw`bg-white rounded-2xl shadow-sm mb-2 overflow-hidden border border-gray-100`,
        { width: itemWidth },
      ]}
      onPress={() => router.push(`/(drawer)/(tabs)/home/product-detail/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={tw`relative`}>
        <Image
          source={{ uri: item.images?.[0] }}
          style={{ width: '100%', height: itemWidth, resizeMode: 'cover' }}
        />
        {item.isOutOfStock && (
          <View style={tw`absolute inset-0 bg-black/40 items-center justify-center`}>
            <View style={tw`bg-red-500 px-3 py-1 rounded-full`}>
              <Text style={tw`text-white text-xs font-bold`}>Out of Stock</Text>
            </View>
          </View>
        )}
        {!item.isOutOfStock && (
          <TouchableOpacity
            style={tw`absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md`}
            onPress={() => handleAddToCart(item.id)}
          >
            <MaterialIcons name="add-shopping-cart" size={20} color={theme.colors.pink1} />
          </TouchableOpacity>
        )}
      </View>

      <View style={tw`p-3`}>
        <Text style={tw`text-gray-900 font-bold text-sm mb-1`} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={tw`flex-row items-baseline mb-2`}>
          <Text style={tw`text-pink1 font-bold text-base`}>₹{item.price}</Text>
          <Text style={tw`text-gray-400 text-xs ml-1`}>/ {item.unit || 'unit'}</Text>
        </View>

        {item.nextDeliveryDate && (
          <View style={tw`flex-row items-center bg-blue-50 px-2 py-1.5 rounded-lg self-start mb-2 border border-blue-100`}>
            <MaterialIcons name="local-shipping" size={12} color="#3B82F6" />
            <Text style={tw`text-[10px] text-blue-700 ml-1.5 font-bold`}>
              {dayjs(item.nextDeliveryDate).format("ddd, DD MMM • h:mm A")}
            </Text>
          </View>
        )}

        {!item.isOutOfStock ? (
          <TouchableOpacity
            style={tw`bg-pink1 py-2 rounded-lg items-center mt-1`}
            onPress={() => handleBuyNow(item.id)}
          >
            <Text style={tw`text-white text-xs font-bold uppercase tracking-wide`}>Buy Now</Text>
          </TouchableOpacity>
        ) : (
          <View style={tw`bg-gray-100 py-2 rounded-lg items-center mt-1`}>
            <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-wide`}>Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function Stores() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams();
  const storeIdNum = parseInt(storeId as string);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);

  const { data: storeData, isLoading, refetch, error } = trpc.user.stores.getStoreWithProducts.useQuery(
    { storeId: storeIdNum },
    { enabled: !!storeIdNum }
  );

  useMarkDataFetchers(() => {
    refetch();
  });

  useDrawerTitle(storeData?.store?.name || 'Store', [storeData?.store?.name]);

  const addToCart = trpc.user.cart.addToCart.useMutation();

  const handleAddToCart = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        Alert.alert('Success', 'Item added to cart!');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

  const handleBuyNow = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        router.push(`/(drawer)/(tabs)/cart?select=${productId}`);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading store...</Text>
      </View>
    );
  }

  if (error || !storeData) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Store not found or error loading</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        data={storeData?.products || []}
        numColumns={2}
        renderItem={({ item }) => renderProduct({ item, router, handleAddToCart, handleBuyNow })}
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={[tw`px-4 pb-24`, { gap: 16 }]}
        ListHeaderComponent={
          <View style={tw`pt-4 pb-6`}>
            <View style={tw`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center`}>
              <View style={tw`w-16 h-16 bg-pink-50 rounded-full items-center justify-center mb-4`}>
                <FontAwesome5 name="store" size={28} color={theme.colors.pink1} />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-900 text-center mb-2`}>{storeData?.store?.name}</Text>
              {storeData?.store?.description && (
                <Text style={tw`text-gray-500 text-center leading-5 px-4`}>{storeData?.store?.description}</Text>
              )}
            </View>
            <View style={tw`flex-row items-center mt-6 mb-2`}>
              <MaterialIcons name="grid-view" size={20} color="#374151" />
              <Text style={tw`text-lg font-bold text-gray-900 ml-2`}>Products from this Store</Text>
            </View>
          </View>
        }
      />
      <LoadingDialog open={isLoadingDialogOpen} message="Processing..." />
    </View>
  );
}