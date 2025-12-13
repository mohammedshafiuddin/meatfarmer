import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MyFlatList, MyText, tw, useMarkDataFetchers, BottomDialog, theme } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';

export default function DeliverySlots() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = trpc.user.slots.getSlotsWithProducts.useQuery();
  const [selectedSlotForDialog, setSelectedSlotForDialog] = useState<any>(null);

  useMarkDataFetchers(() => {
    refetch();
  });

  if (isLoading) {
    return (
      <MyFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View style={tw`flex-1 justify-center items-center p-8`}>
            <Text style={tw`text-gray-600`}>Loading delivery slots...</Text>
          </View>
        )}
      />
    );
  }

  if (error) {
    return (
      <MyFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View style={tw`flex-1 justify-center items-center p-8`}>
            <Text style={tw`text-red-600`}>Error loading delivery slots</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
            >
              <Text style={tw`text-white font-semibold`}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    );
  }

  const slots = data?.slots || [];

  if (slots.length === 0) {
    return (
      <MyFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View style={tw`flex-1 justify-center items-center p-8`}>
            <MaterialIcons name="schedule" size={64} color="#D1D5DB" />
            <Text style={tw`text-gray-500 text-center mt-4 text-lg`}>
              No upcoming delivery slots available
            </Text>
            <Text style={tw`text-gray-400 text-center mt-2`}>
              Check back later for new delivery schedules
            </Text>
          </View>
        )}
      />
    );
  }

  return (
    <>
    <MyFlatList
      data={slots}
      keyExtractor={(item) => item.id.toString()}
      // ListHeaderComponent={() => (
      //   <View style={tw`p-4 pb-2`}>
      //     <Text style={tw`text-2xl font-bold text-gray-800`}>Delivery Slots</Text>
      //     <Text style={tw`text-gray-600 mt-1`}>
      //       Choose your preferred delivery time
      //     </Text>
      //   </View>
      // )}
      renderItem={({ item: slot }) => (
        <View style={tw`mx-4 mb-4 bg-white rounded-xl shadow-md overflow-hidden`}>
          {/* Slot Header */}
          <View style={tw`bg-pink-50 p-4 border-b border-pink-100`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-lg font-bold text-gray-800`}>
                  {dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a')}
                </Text>
                <Text style={tw`text-sm text-gray-600 mt-1`}>
                  Orders close by: {dayjs(slot.freezeTime).format('h:mm a')}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-pink-500 px-3 py-1 rounded-full mr-3`}>
                  <Text style={tw`text-white text-sm font-semibold`}>
                    {slot.products.length} items
                  </Text>
                </View>
                 <TouchableOpacity
                   onPress={() => router.push(`/(drawer)/(tabs)/cart?slot=${slot.id}`)}
                   style={tw`bg-pink-500 p-2 rounded-full`}
                 >
                  <MaterialIcons name="flash-on" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Products List */}
          <View style={tw`p-4`}>
            <Text style={tw`text-base font-semibold text-gray-700 mb-3`}>
              Available Products
            </Text>
            <View style={tw`space-y-2`}>
              {slot.products.slice(0, 2).map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => router.push(`/(drawer)/(tabs)/home/product-detail/${product.id}`)}
                  style={tw`bg-gray-50 rounded-lg p-3 flex-row items-center`}
                >
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={tw`w-8 h-8 rounded mr-3`}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={tw`w-8 h-8 bg-gray-200 rounded mr-3 justify-center items-center`}>
                      <MaterialIcons name="image" size={16} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-medium text-gray-800`} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={tw`text-xs text-gray-600`}>
                      ₹{product.price} {product.unit && `per ${product.unit}`}
                    </Text>
                  </View>
                  {product.isOutOfStock && (
                    <Text style={tw`text-xs text-red-500 font-medium`}>Out of stock</Text>
                  )}
                </TouchableOpacity>
              ))}

              {slot.products.length > 2 && (
                <TouchableOpacity
                  onPress={() => setSelectedSlotForDialog(slot)}
                  style={tw`bg-pink-50 rounded-lg p-3 flex-row items-center justify-center border border-pink-200`}
                >
                  <Text style={tw`text-sm font-medium text-pink-700`}>
                    +{slot.products.length - 2} more products
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color={theme.colors.brand500} style={tw`ml-1`} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
      ListFooterComponent={() => <View style={tw`h-4`} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`pt-2`}
    />

    {/* Products Dialog */}
    <BottomDialog
      open={!!selectedSlotForDialog}
      onClose={() => setSelectedSlotForDialog(null)}
    >
      <View style={tw`p-6`}>
        <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>
          All Products - {dayjs(selectedSlotForDialog?.deliveryTime).format('ddd DD MMM, h:mm a')}
        </Text>

        <ScrollView style={tw`max-h-96`} showsVerticalScrollIndicator={false}>
          <View style={tw`space-y-3`}>
            {selectedSlotForDialog?.products.map((product: any) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => {
                  setSelectedSlotForDialog(null);
                  router.push(`/(drawer)/(tabs)/home/product-detail/${product.id}`);
                }}
                style={tw`bg-gray-50 rounded-lg p-4 flex-row items-center`}
              >
                {product.images && product.images.length > 0 ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={tw`w-12 h-12 rounded mr-4`}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={tw`w-12 h-12 bg-gray-200 rounded mr-4 justify-center items-center`}>
                    <MaterialIcons name="image" size={20} color="#9CA3AF" />
                  </View>
                )}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-medium text-gray-800`} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={tw`text-sm text-gray-600 mt-1`}>
                    ₹{product.price} {product.unit && `per ${product.unit}`}
                  </Text>
                  {product.marketPrice && (
                    <Text style={tw`text-sm text-gray-500 line-through`}>
                      ₹{product.marketPrice}
                    </Text>
                  )}
                </View>
                {product.isOutOfStock && (
                  <Text style={tw`text-xs text-red-500 font-medium`}>Out of stock</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomDialog>
    </>
  );
}