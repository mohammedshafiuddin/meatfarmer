import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Dimensions } from 'react-native';
import { TabViewWrapper, AppContainer, MyText } from 'common-ui';

interface Order {
  orderId: string;
  customerName: string;
  address: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number; amount: number }[];
  deliveryTime: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

const mockOrders: Order[] = [
  {
    orderId: '1',
    customerName: 'John Doe',
    address: '123 Main St, City',
    totalAmount: 150,
    items: [
      { name: 'Chicken', quantity: 1, price: 100, amount: 100 },
      { name: 'Beef', quantity: 0.5, price: 100, amount: 50 },
    ],
    deliveryTime: '10 AM',
    status: 'pending',
  },
  {
    orderId: '2',
    customerName: 'Jane Smith',
    address: '456 Elm St, City',
    totalAmount: 200,
    items: [
      { name: 'Mutton', quantity: 2, price: 100, amount: 200 },
    ],
    deliveryTime: '11 AM',
    status: 'pending',
  },
  {
    orderId: '3',
    customerName: 'Bob Johnson',
    address: '789 Oak St, City',
    totalAmount: 100,
    items: [
      { name: 'Fish', quantity: 1, price: 100, amount: 100 },
    ],
    deliveryTime: '12 PM',
    status: 'delivered',
  },
  {
    orderId: '4',
    customerName: 'Alice Brown',
    address: '101 Pine St, City',
    totalAmount: 250,
    items: [
      { name: 'Chicken', quantity: 2, price: 100, amount: 200 },
      { name: 'Eggs', quantity: 1, price: 50, amount: 50 },
    ],
    deliveryTime: '1 PM',
    status: 'delivered',
  },
  {
    orderId: '5',
    customerName: 'Eve Wilson',
    address: '202 Maple St, City',
    totalAmount: 180,
    items: [
      { name: 'Pork', quantity: 1, price: 180, amount: 180 },
    ],
    deliveryTime: '2 PM',
    status: 'cancelled',
  },
];

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
  const routes = [
    { key: 'pending', title: 'Pending' },
    { key: 'delivered', title: 'Delivered' },
    { key: 'cancelled', title: 'Cancelled' },
  ];

  const renderScene = ({ route }: any) => {
    const filteredOrders = mockOrders.filter(order => order.status === route.key);
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