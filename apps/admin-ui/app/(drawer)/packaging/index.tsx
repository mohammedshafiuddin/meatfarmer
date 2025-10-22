import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import { TabViewWrapper, AppContainer, MyText, useManualRefresh } from 'common-ui';
import { Order, useUpdatePackaged } from '@/src/api-hooks/order.api';
import { useGetSlots, useGetSlotOrders } from '@/src/api-hooks/slot.api';
import { useLocalSearchParams } from 'expo-router';

const OrderItem = ({ order, isPackagedTab, onTogglePackaged }: { order: Order; isPackagedTab: boolean; onTogglePackaged: (orderId: string, isPackaged: boolean) => void }) => {
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MyText style={{ fontWeight: 'bold' }}>{order.customerName} - #{order.readableId}</MyText>
        <TouchableOpacity onPress={() => onTogglePackaged(order.orderId, !isPackagedTab)}>
          <MyText style={{ color: isPackagedTab ? 'red' : 'green' }}>
            {isPackagedTab ? 'Mark not packaged' : 'Mark Packaged'}
          </MyText>
        </TouchableOpacity>
      </View>
      <MyText numberOfLines={1}>{order.address}</MyText>
      <MyText>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity}) - ₹${item.amount}`).join(', ')}{moreItems}
      </MyText>
    </TouchableOpacity>
  );
};

export default function Packaging() {
  const [index, setIndex] = useState(0);
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const { data: ordersResponse, isLoading, error, refetch, isRefetching } = useGetSlotOrders(selectedSlotId || 0);
  const orders = ordersResponse?.data;
  const { data: slotsData } = useGetSlots();
  const updatePackagedMutation = useUpdatePackaged();

  useManualRefresh(() => refetch());

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      // If no slotId from params, default to first slot
      // But since selectedSlotId is derived from params, this might not be needed
      // Keep for safety if slotId is invalid
    }
  }, [slotsData, selectedSlotId]);

  const notPackagedCount = (orders || []).filter(order => !order.isPackaged).length;
  const packagedCount = (orders || []).filter(order => order.isPackaged).length;

  const handleTogglePackaged = (orderId: string, isPackaged: boolean) => {
    updatePackagedMutation.mutate({ orderId, isPackaged });
  };

  const routes = [
    { key: 'not_packaged', title: `Not Packaged (${notPackagedCount})` },
    { key: 'packaged', title: `Packaged (${packagedCount})` },
  ];

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

  const renderScene = ({ route }: any) => {
    const isPackagedTab = route.key === 'packaged';
    const filteredOrders = (orders || []).filter(order => {
      return route.key === 'not_packaged' ? !order.isPackaged : order.isPackaged;
    });
    return (
      <View style={{ flex: 1, padding: 10 }}>
        {filteredOrders.length === 0 ? (
          <MyText>No orders</MyText>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {filteredOrders.map(order => <OrderItem key={order.readableId} order={order} isPackagedTab={isPackagedTab} onTogglePackaged={handleTogglePackaged} />)}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <AppContainer>
      <TabViewWrapper
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
      />
    </AppContainer>
  );
}