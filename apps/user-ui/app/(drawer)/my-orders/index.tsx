import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, Image, TouchableOpacity } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { tw } from 'common-ui';
import { BottomDialog } from 'common-ui';

const orders = [
  {
    orderId: 'ORD001',
    orderDate: '2025-10-15T10:00:00Z',
    deliveryStatus: 'success',
    deliveryDate: '2025-10-16T14:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'Online',
    items: [
      { productName: 'Fresh Organic Apples', quantity: 2, price: 120, amount: 240, image: 'https://picsum.photos/50/50?random=1' },
      { productName: 'Organic Bananas', quantity: 1, price: 80, amount: 80, image: 'https://picsum.photos/50/50?random=2' },
      { productName: 'Carrots', quantity: 3, price: 50, amount: 150, image: 'https://picsum.photos/50/50?random=3' },
      { productName: 'Tomatoes', quantity: 2, price: 60, amount: 120, image: 'https://picsum.photos/50/50?random=4' },
    ],
  },
  {
    orderId: 'ORD002',
    orderDate: '2025-10-14T09:30:00Z',
    deliveryStatus: 'pending',
    deliveryDate: '2025-10-17T11:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'CoD',
    items: [
      { productName: 'Potatoes', quantity: 5, price: 40, amount: 200, image: 'https://picsum.photos/50/50?random=5' },
      { productName: 'Onions', quantity: 2, price: 30, amount: 60, image: 'https://picsum.photos/50/50?random=6' },
      { productName: 'Spinach', quantity: 1, price: 25, amount: 25, image: 'https://picsum.photos/50/50?random=7' },
      { productName: 'Broccoli', quantity: 2, price: 70, amount: 140, image: 'https://picsum.photos/50/50?random=8' },
    ],
  },
  {
    orderId: 'ORD003',
    orderDate: '2025-10-13T15:45:00Z',
    deliveryStatus: 'failed',
    deliveryDate: '2025-10-15T16:00:00Z',
    orderStatus: 'failed',
    cancelReason: 'Delivery address not found',
    paymentMode: 'Online',
    items: [
      { productName: 'Milk', quantity: 2, price: 50, amount: 100, image: 'https://picsum.photos/50/50?random=9' },
      { productName: 'Bread', quantity: 3, price: 20, amount: 60, image: 'https://picsum.photos/50/50?random=10' },
      { productName: 'Eggs', quantity: 1, price: 60, amount: 60, image: 'https://picsum.photos/50/50?random=11' },
      { productName: 'Cheese', quantity: 1, price: 100, amount: 100, image: 'https://picsum.photos/50/50?random=12' },
    ],
  },
  {
    orderId: 'ORD004',
    orderDate: '2025-10-12T12:00:00Z',
    deliveryStatus: 'success',
    deliveryDate: '2025-10-13T10:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'CoD',
    items: [
      { productName: 'Chicken Breast', quantity: 1, price: 200, amount: 200, image: 'https://picsum.photos/50/50?random=13' },
      { productName: 'Fish Fillet', quantity: 2, price: 150, amount: 300, image: 'https://picsum.photos/50/50?random=14' },
      { productName: 'Rice', quantity: 5, price: 80, amount: 400, image: 'https://picsum.photos/50/50?random=15' },
      { productName: 'Pasta', quantity: 3, price: 90, amount: 270, image: 'https://picsum.photos/50/50?random=16' },
    ],
  },
  {
    orderId: 'ORD005',
    orderDate: '2025-10-11T08:15:00Z',
    deliveryStatus: 'pending',
    deliveryDate: '2025-10-18T09:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'Online',
    items: [
      { productName: 'Apples', quantity: 4, price: 100, amount: 400, image: 'https://picsum.photos/50/50?random=17' },
      { productName: 'Oranges', quantity: 3, price: 70, amount: 210, image: 'https://picsum.photos/50/50?random=18' },
      { productName: 'Grapes', quantity: 2, price: 120, amount: 240, image: 'https://picsum.photos/50/50?random=19' },
      { productName: 'Strawberries', quantity: 1, price: 150, amount: 150, image: 'https://picsum.photos/50/50?random=20' },
    ],
  },
  {
    orderId: 'ORD006',
    orderDate: '2025-10-10T14:20:00Z',
    deliveryStatus: 'success',
    deliveryDate: '2025-10-11T13:00:00Z',
    orderStatus: 'cancelled',
    cancelReason: 'Customer request',
    paymentMode: 'CoD',
    items: [
      { productName: 'Beef Steak', quantity: 1, price: 300, amount: 300, image: 'https://picsum.photos/50/50?random=21' },
      { productName: 'Lamb Chops', quantity: 2, price: 250, amount: 500, image: 'https://picsum.photos/50/50?random=22' },
      { productName: 'Salad Mix', quantity: 3, price: 40, amount: 120, image: 'https://picsum.photos/50/50?random=23' },
      { productName: 'Olive Oil', quantity: 1, price: 200, amount: 200, image: 'https://picsum.photos/50/50?random=24' },
    ],
  },
  {
    orderId: 'ORD007',
    orderDate: '2025-10-09T11:10:00Z',
    deliveryStatus: 'failed',
    deliveryDate: '2025-10-12T15:00:00Z',
    orderStatus: 'failed',
    cancelReason: 'Out of stock',
    paymentMode: 'Online',
    items: [
      { productName: 'Yogurt', quantity: 4, price: 30, amount: 120, image: 'https://picsum.photos/50/50?random=25' },
      { productName: 'Butter', quantity: 2, price: 80, amount: 160, image: 'https://picsum.photos/50/50?random=26' },
      { productName: 'Honey', quantity: 1, price: 150, amount: 150, image: 'https://picsum.photos/50/50?random=27' },
      { productName: 'Jam', quantity: 2, price: 60, amount: 120, image: 'https://picsum.photos/50/50?random=28' },
    ],
  },
  {
    orderId: 'ORD008',
    orderDate: '2025-10-08T16:30:00Z',
    deliveryStatus: 'success',
    deliveryDate: '2025-10-09T12:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'CoD',
    items: [
      { productName: 'Coffee Beans', quantity: 1, price: 250, amount: 250, image: 'https://picsum.photos/50/50?random=29' },
      { productName: 'Tea Bags', quantity: 5, price: 20, amount: 100, image: 'https://picsum.photos/50/50?random=30' },
      { productName: 'Sugar', quantity: 2, price: 50, amount: 100, image: 'https://picsum.photos/50/50?random=31' },
      { productName: 'Milk Powder', quantity: 1, price: 120, amount: 120, image: 'https://picsum.photos/50/50?random=32' },
    ],
  },
  {
    orderId: 'ORD009',
    orderDate: '2025-10-07T13:45:00Z',
    deliveryStatus: 'pending',
    deliveryDate: '2025-10-19T10:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'Online',
    items: [
      { productName: 'Flour', quantity: 3, price: 60, amount: 180, image: 'https://picsum.photos/50/50?random=33' },
      { productName: 'Baking Powder', quantity: 1, price: 40, amount: 40, image: 'https://picsum.photos/50/50?random=34' },
      { productName: 'Vanilla Extract', quantity: 1, price: 100, amount: 100, image: 'https://picsum.photos/50/50?random=35' },
      { productName: 'Chocolate Chips', quantity: 2, price: 80, amount: 160, image: 'https://picsum.photos/50/50?random=36' },
    ],
  },
  {
    orderId: 'ORD010',
    orderDate: '2025-10-06T17:00:00Z',
    deliveryStatus: 'success',
    deliveryDate: '2025-10-07T14:00:00Z',
    orderStatus: 'success',
    cancelReason: null,
    paymentMode: 'CoD',
    items: [
      { productName: 'Cereal', quantity: 2, price: 90, amount: 180, image: 'https://picsum.photos/50/50?random=37' },
      { productName: 'Oatmeal', quantity: 3, price: 70, amount: 210, image: 'https://picsum.photos/50/50?random=38' },
      { productName: 'Nuts Mix', quantity: 1, price: 200, amount: 200, image: 'https://picsum.photos/50/50?random=39' },
      { productName: 'Dried Fruits', quantity: 2, price: 150, amount: 300, image: 'https://picsum.photos/50/50?random=40' },
    ],
  },
];



export default function MyOrders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItems, setDialogItems] = useState<typeof orders[0]['items']>([]);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [menuOrderId, setMenuOrderId] = useState<string>('');
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [complaintOrderId, setComplaintOrderId] = useState<string>('');

  const openDialog = (items: typeof orders[0]['items']) => {
    setDialogItems(items);
    setDialogOpen(true);
  };

  const renderOrder = ({ item }: { item: typeof orders[0] }) => (
    <View style={tw`mb-4 p-4 bg-gray-100 rounded relative`}>
      <TouchableOpacity onPress={() => { setMenuOrderId(item.orderId); setMenuDialogOpen(true); }} style={tw`absolute top-2 right-2`}>
        <Entypo name="dots-three-vertical" size={20} color="black" />
      </TouchableOpacity>
      <Text style={tw`text-lg font-bold`}>Order ID: {item.orderId}</Text>
      <Text style={tw`text-sm text-gray-600`}>Order Date: {new Date(item.orderDate).toLocaleString()}</Text>
      <Text style={tw`text-sm`}>Delivery Status: {item.deliveryStatus}</Text>
      <Text style={tw`text-sm`}>Order Status: {item.orderStatus}</Text>
      {item.cancelReason && <Text style={tw`text-sm text-red-500`}>Cancel Reason: {item.cancelReason}</Text>}
      <Text style={tw`text-sm`}>Payment Mode: {item.paymentMode}</Text>
      <Text style={tw`text-base font-semibold mt-2`}>Items:</Text>
      {item.items.slice(0, 3).map((product, index) => (
        <View key={index} style={tw`flex-row items-center ml-4 mt-1`}>
          <Image source={{ uri: product.image }} style={tw`w-8 h-8 rounded mr-2`} />
          <Text style={tw`text-sm`}>{product.productName} - Qty: {product.quantity}, Price: ₹{product.price}, Amount: ₹{product.amount}</Text>
        </View>
      ))}
      {item.items.length > 3 && (
        <TouchableOpacity onPress={() => openDialog(item.items)} style={tw`ml-4 mt-1`}>
          <Text style={tw`text-sm text-blue-500`}>+{item.items.length - 3} more</Text>
        </TouchableOpacity>
      )}
      <Text style={tw`text-base font-bold mt-2`}>Total: ₹{item.items.reduce((sum, p) => sum + p.amount, 0)}</Text>
    </View>
  );

  return (
    <>
      <FlatList
        style={tw`flex-1 bg-white`}
        contentContainerStyle={tw`p-4`}
        data={orders}
        renderItem={({ item }) => renderOrder({ item })}
        keyExtractor={(item) => item.orderId}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={tw`text-2xl font-bold mb-4`}>My Orders</Text>}
      />
      <BottomDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>All Items</Text>
          {dialogItems.map((product, index) => (
            <View key={index} style={tw`flex-row items-center mb-2`}>
              <Image source={{ uri: product.image }} style={tw`w-8 h-8 rounded mr-2`} />
              <Text style={tw`text-sm`}>{product.productName} - Qty: {product.quantity}, Price: ₹{product.price}, Amount: ₹{product.amount}</Text>
            </View>
          ))}
        </View>
      </BottomDialog>
      <BottomDialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Options for Order {menuOrderId}</Text>
          <TouchableOpacity onPress={() => { setComplaintOrderId(menuOrderId); setComplaintDialogOpen(true); setMenuDialogOpen(false); }}>
            <Text style={tw`text-sm py-2`}>Raise Complaint</Text>
          </TouchableOpacity>
        </View>
      </BottomDialog>
      <BottomDialog open={complaintDialogOpen} onClose={() => setComplaintDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Raise Complaint for Order {complaintOrderId}</Text>
          <Text style={tw`text-sm mb-4`}>Your complaint has been submitted successfully!</Text>
        </View>
      </BottomDialog>
    </>
  );
}