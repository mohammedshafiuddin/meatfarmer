import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions, DeviceEventEmitter } from 'react-native';
import dayjs from 'dayjs';
import { REFRESH_EVENT } from 'common-ui/src/lib/const-strs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TabViewWrapper, AppContainer, MyText, CustomDropdown, useManualRefresh } from 'common-ui';
import { Order, useUpdateDelivered } from '@/src/api-hooks/order.api';
import { useGetSlots, useGetSlotOrders } from '@/src/api-hooks/slot.api';

const DeliveryOrderItem = ({ order, isDeliveredTab, onToggleDelivered }: { order: Order; isDeliveredTab: boolean; onToggleDelivered: (orderId: string, isDelivered: boolean) => void }) => {
  return (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MyText style={{ fontWeight: 'bold' }}>{order.customerName} - #{order.readableId}</MyText>
        <TouchableOpacity onPress={() => onToggleDelivered(order.orderId, !isDeliveredTab)}>
          <MyText style={{ color: isDeliveredTab ? 'red' : 'green' }}>
            {isDeliveredTab ? 'Mark not delivered' : 'Mark Delivered'}
          </MyText>
        </TouchableOpacity>
      </View>
      <MyText numberOfLines={1}>{order.address}</MyText>
      <MyText>₹{order.totalAmount}{order.isCod ? '' : ' (paid)'}</MyText>
    </View>
  );
};

export default function Delivery() {
  const [index, setIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const { data: ordersResponse, isLoading, error, refetch, isRefetching } = useGetSlotOrders(selectedSlotId || 0);
  const orders = ordersResponse?.data;
  const { data: slotsData } = useGetSlots();
  const updateDeliveredMutation = useUpdateDelivered();

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slotsData.slots[0].id);
    }
  }, [slotsData]);

  useManualRefresh(() => refetch());

  const notDeliveredCount = (orders || []).filter(order => !order.isDelivered).length;
  const deliveredCount = (orders || []).filter(order => order.isDelivered).length;

  const routes = [
    { key: 'not_delivered', title: `Not Delivered (${notDeliveredCount})` },
    { key: 'delivered', title: `Delivered (${deliveredCount})` },
  ];

  const handleToggleDelivered = (orderId: string, isDelivered: boolean) => {
    updateDeliveredMutation.mutate({ orderId, isDelivered });
  };

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
    const isDeliveredTab = route.key === 'delivered';
    const filteredOrders = (orders || []).filter(order => {
      return route.key === 'not_delivered' ? !order.isDelivered : order.isDelivered;
    });
    return (
      <View style={{ flex: 1, padding: 10 }}>
        {filteredOrders.length === 0 ? (
          <MyText>No orders</MyText>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {filteredOrders.map(order => <DeliveryOrderItem key={order.readableId} order={order} isDeliveredTab={isDeliveredTab} onToggleDelivered={handleToggleDelivered} />)}
          </ScrollView>
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