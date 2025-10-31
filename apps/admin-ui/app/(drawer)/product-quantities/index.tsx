import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { AppContainer, MyText, useManualRefresh, tw } from 'common-ui';
import { useGetSlotOrders } from '@/src/api-hooks/slot.api';
import { useLocalSearchParams } from 'expo-router';

interface ProductQuantity {
  name: string;
  totalQuantity: number;
  unit: string;
}

export default function ProductQuantities() {
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const { data: ordersResponse, isLoading, error, refetch } = useGetSlotOrders(selectedSlotId || 0);

  useManualRefresh(() => refetch());

  const productQuantities = useMemo(() => {
    const orders = ordersResponse?.data || [];
    const quantityMap = new Map<string, ProductQuantity>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = quantityMap.get(item.name);
        if (existing) {
          existing.totalQuantity += item.quantity;
        } else {
          quantityMap.set(item.name, {
            name: item.name,
            totalQuantity: item.quantity,
            unit: item.unit || '',
          });
        }
      });
    });

    return Array.from(quantityMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [ordersResponse]);

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading orders...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading orders</MyText>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <MyText style={tw`text-3xl font-bold mb-8 text-center text-gray-800`}>
        Product Quantities
      </MyText>

      {productQuantities.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-500`}>No products found</MyText>
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          {productQuantities.map(product => (
            <View key={product.name} style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg`}>
              <MyText style={tw`font-bold text-gray-800 mb-1`}>{product.name}</MyText>
              <MyText style={tw`text-gray-700`}>Total Quantity: {product.totalQuantity} {product.unit}</MyText>
            </View>
          ))}
        </ScrollView>
      )}
    </AppContainer>
  );
}