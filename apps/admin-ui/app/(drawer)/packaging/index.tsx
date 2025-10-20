import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions, DeviceEventEmitter } from 'react-native';
import dayjs from 'dayjs';
import { REFRESH_EVENT } from 'common-ui/src/lib/const-strs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TabViewWrapper, AppContainer, MyText, useManualRefresh, CustomDropdown } from 'common-ui';
import { useGetTodaysOrders, Order } from '@/src/api-hooks/order.api';
import { useGetSlots } from '@/src/api-hooks/slot.api';

const OrderItem = ({ order }: { order: Order }) => {
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <MyText style={{ fontWeight: 'bold' }}>{order.customerName}</MyText>
      <MyText numberOfLines={1}>{order.address}</MyText>
      <MyText>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity}) - ₹${item.amount}`).join(', ')}{moreItems}
      </MyText>
    </TouchableOpacity>
  );
};

export default function Packaging() {
  const [index, setIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const { data: orders, isLoading, error, refetch, isRefetching } = useGetTodaysOrders(selectedSlotId);
  const { data: slotsData } = useGetSlots();

  useManualRefresh(() => refetch());

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slotsData.slots[0].id);
    }
  }, [slotsData]);
  const routes = [
    { key: 'not_packaged', title: 'Not Packaged' },
    { key: 'packaged', title: 'Packaged' },
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
    const filteredOrders = (orders || []).filter(order => {
      return route.key === 'not_packaged' ? !order.isPackaged : order.isPackaged;
    });
    return (
      <View style={{ flex: 1, padding: 10 }}>
        {filteredOrders.length === 0 ? (
          <MyText>No orders</MyText>
        ) : (
          <>
          {filteredOrders.map(order => <OrderItem key={order.orderId} order={order} />)}
          {filteredOrders.map(order => <OrderItem key={order.orderId} order={order} />)}
          {filteredOrders.map(order => <OrderItem key={order.orderId} order={order} />)}
          {filteredOrders.map(order => <OrderItem key={order.orderId} order={order} />)}
          {filteredOrders.map(order => <OrderItem key={order.orderId} order={order} />)}
          </>
        )}
      </View>
    );
  };

  return (
    <AppContainer>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <CustomDropdown
            label='Select Slot'
            options={slotsData?.slots?.map(slot => ({ label: dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a'), value: slot.id })) || []}
            value={selectedSlotId || ''}
            onValueChange={val => setSelectedSlotId(Number(val))}
            placeholder="Select Slot"
          />
        </View>
        <TouchableOpacity onPress={() => DeviceEventEmitter.emit(REFRESH_EVENT)}>
          <MaterialIcons name="refresh" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TabViewWrapper
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
      />
    </AppContainer>
  );
}