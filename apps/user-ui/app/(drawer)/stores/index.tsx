import React from 'react';
import {
  View,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ImageCarousel, theme, tw, useManualRefresh, MyFlatList, useDrawerTitle } from 'common-ui';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { trpc } from '@/src/trpc-client';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 40 - 20) / 2; // 40px for px-5 padding (20px each side), 20px for margins

const renderProduct = ({ item, router, handleAddToCart, handleBuyNow }: { item: any; router: any; handleAddToCart: any; handleBuyNow: any }) => {
  return (
    <TouchableOpacity
      style={[tw`flex-1 bg-white rounded-lg items-center shadow-md`]}
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
          ₹{item.price} per {item.unit || 'unit'}
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

export default function Stores() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams();
  const storeIdNum = parseInt(storeId as string);

  const { data: storeData, isLoading } = trpc.user.stores.getStoreWithProducts.useQuery(
    { storeId: storeIdNum },
    { enabled: !!storeIdNum }
  );

  useDrawerTitle(storeData?.store?.name || 'Store',[storeData?.store?.name]);

  const addToCart = trpc.user.cart.addToCart.useMutation();

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
      <View style={tw`flex-1 justify-center items-center bg-gray1`}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray1`}>
      <MyFlatList
        data={storeData?.products || []}
        numColumns={2}
        renderItem={({ item }) => renderProduct({ item, router, handleAddToCart, handleBuyNow })}
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={{ gap: 12 }} // horizontal gap between items
        contentContainerStyle={[tw`px-4`, { gap: 12 }]} // vertical gap
        ListHeaderComponent={
          <View style={tw`pt-5 pb-3`}>
            <Text style={tw`text-lg font-medium`}>{storeData?.store?.name}</Text>
            {storeData?.store?.description && (
              <Text style={tw`text-sm text-gray-600`}>{storeData?.store?.description}</Text>
            )}
          </View>
        }
      />
    </View>
  );
}