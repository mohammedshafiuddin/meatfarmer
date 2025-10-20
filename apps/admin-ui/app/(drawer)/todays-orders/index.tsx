import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Dimensions, DeviceEventEmitter } from 'react-native';
import { REFRESH_EVENT } from 'common-ui/src/lib/const-strs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TabViewWrapper, AppContainer, MyText, useManualRefresh } from 'common-ui';
import { useGetTodaysOrders, Order } from '@/src/api-hooks/order.api';

const OrderItem = ({ order }: { order: Order }) => {
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <MyText style={{ fontWeight: 'bold' }}>{order.customerName}</MyText>
      <MyText>{order.address}</MyText>
      <MyText>Delivery: {order.deliveryTime}</MyText>
      <MyText>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity})`).join(', ')}{moreItems}
      </MyText>
      <MyText>Total: ₹{order.totalAmount}</MyText>
    </TouchableOpacity>
  );
};

export default function TodaysOrders() {
  const [index, setIndex] = useState(0);
  const { data: orders, isLoading, error, refetch, isRefetching } = useGetTodaysOrders();

  useManualRefresh(() => refetch());
  const routes = [
    { key: 'pending', title: 'Pending' },
    { key: 'delivered', title: 'Delivered' },
    { key: 'cancelled', title: 'Cancelled' },
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
    const filteredOrders = (orders || []).filter(order => order.status === route.key);
    return (
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        renderItem={({ item }) => <OrderItem order={item} />}
        ListEmptyComponent={<MyText>No orders</MyText>}
      />
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