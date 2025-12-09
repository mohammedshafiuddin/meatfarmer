import React from "react";
import {
  View,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  theme,
  tw,
  useManualRefresh,
  useMarkDataFetchers,
  MyFlatList,
} from "common-ui";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { trpc } from "@/src/trpc-client";

const renderStore = ({
  item,
  router,
}: {
  item: any;
  router: any;
}) => {
  const sampleProducts = item.sampleProducts || [];
  const remainingCount = item.productCount - sampleProducts.length;

  return (
    <TouchableOpacity
      style={tw`bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100 mx-4`}
      onPress={() => router.push(`/(drawer)/(tabs)/stores/store-detail/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={tw`flex-row p-4`}>
        {/* Store Image */}
        <View style={tw`w-20 h-20 rounded-xl overflow-hidden mr-4`}>
          <Image
            source={{ uri: item.signedImageUrl || undefined }}
            style={tw`w-full h-full`}
            resizeMode="cover"
          />
          {!item.signedImageUrl && (
            <View style={tw`absolute inset-0 bg-gray-200 items-center justify-center`}>
              <MaterialIcons name="storefront" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Store Details */}
        <View style={tw`flex-1`}>
          <Text style={tw`text-gray-900 font-bold text-lg mb-2`} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Sample Products */}
          <View style={tw`flex-row flex-wrap`}>
            {sampleProducts.map((product: any, index: number) => (
              <View key={product.id} style={tw`flex-row items-center mr-3 mb-1`}>
                <Image
                  source={{ uri: product.signedImageUrl || undefined }}
                  style={tw`w-6 h-6 rounded mr-1`}
                  resizeMode="cover"
                />
                <Text style={tw`text-gray-600 text-xs`} numberOfLines={1}>
                  {product.name}
                </Text>
              </View>
            ))}
            {remainingCount > 0 && (
              <Text style={tw`text-gray-500 text-xs font-medium`}>
                +{remainingCount} more
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Stores() {
  const router = useRouter();

  const {
    data: storesData,
    isLoading,
    error,
    refetch,
  } = trpc.user.stores.getStores.useQuery();

  const stores = storesData?.stores || [];

  useManualRefresh(() => {
    refetch();
  });

  useMarkDataFetchers(() => {
    refetch();
  });

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading stores...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Failed to load stores</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        data={stores}
        renderItem={({ item }) => renderStore({ item, router })}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={tw`pt-4 pb-24`}
        ListHeaderComponent={
          <View style={tw`px-4 pb-2`}>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Stores</Text>
            <Text style={tw`text-gray-500 text-base font-medium mt-1`}>Explore our store collection</Text>
          </View>
        }
      />
    </View>
  );
}