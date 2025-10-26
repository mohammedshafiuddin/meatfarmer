import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { AppContainer, MyText, useManualRefresh } from 'common-ui';
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
        <MyText>Loading orders...</MyText>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <MyText>Error loading orders</MyText>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <MyText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Product Quantities
      </MyText>

      {productQuantities.length === 0 ? (
        <MyText>No products found</MyText>
      ) : (
        <ScrollView>
          {productQuantities.map(product => (
            <View key={product.name} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
              <MyText style={{ fontWeight: 'bold' }}>{product.name}</MyText>
              <MyText>Total Quantity: {product.totalQuantity} {product.unit}</MyText>
            </View>
          ))}
        </ScrollView>
      )}
    </AppContainer>
  );
}