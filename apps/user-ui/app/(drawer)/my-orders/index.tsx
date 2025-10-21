import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { tw, useManualRefresh } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { useGetUserOrders, useCancelOrder, useRaiseComplaint } from '../../../src/api-hooks/order.api';

export default function MyOrders() {
  const { data: ordersData, isLoading, error, refetch } = useGetUserOrders();
  const cancelOrderMutation = useCancelOrder();
  const raiseComplaintMutation = useRaiseComplaint();
  const orders = ordersData?.data || [];

  useManualRefresh(() => refetch());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItems, setDialogItems] = useState<typeof orders[0]['items']>([]);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [menuOrderId, setMenuOrderId] = useState<string>('');
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [complaintOrderId, setComplaintOrderId] = useState<string>('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [complaintBody, setComplaintBody] = useState<string>('');

  const openDialog = useCallback((items: typeof orders[0]['items']) => {
    setDialogItems(items);
    setDialogOpen(true);
  }, []);

  const renderOrder = useCallback(({ item }: { item: typeof orders[0] }) => (
    <View style={tw`mb-4 p-4 bg-gray-100 rounded relative`}>
      
      <Text style={tw`text-lg font-bold`}>Order ID: {item.orderId}</Text>
      <Text style={tw`text-sm text-gray-600`}>Order Date: {new Date(item.orderDate).toLocaleString()}</Text>
      <Text style={tw`text-sm`}>Delivery Status: {item.deliveryStatus}</Text>
       <Text style={tw`text-sm`}>Order Status: {item.orderStatus}</Text>
       {item.cancelReason && <Text style={tw`text-sm text-red-500`}>Cancel Reason: {item.cancelReason}</Text>}
       {item.orderStatus === 'cancelled' && item.isRefundDone && <Text style={tw`text-sm text-green-500`}>Refund Processed</Text>}
      <Text style={tw`text-sm`}>Payment Mode: {item.paymentMode}</Text>
      <Text style={tw`text-base font-semibold mt-2`}>Items:</Text>
      {item.items.slice(0, 3).map((product, index) => (
        <View key={index} style={tw`flex-row items-center ml-4 mt-1`}>
          <Image source={{ uri: product.image || undefined }} style={tw`w-8 h-8 rounded mr-2`} />
          <Text style={tw`text-sm`}>{product.productName} - Qty: {product.quantity}, Price: ₹{product.price}, Amount: ₹{product.amount}</Text>
        </View>
      ))}
      {item.items.length > 3 && (
        <TouchableOpacity onPress={() => openDialog(item.items)} style={tw`ml-4 mt-1`}>
          <Text style={tw`text-sm text-blue-500`}>+{item.items.length - 3} more</Text>
        </TouchableOpacity>
      )}
      <Text style={tw`text-base font-bold mt-2`}>Total: ₹{item.items.reduce((sum, p) => sum + p.amount, 0)}</Text>
      <TouchableOpacity onPress={() => { setMenuOrderId(item.orderId); setMenuDialogOpen(true); }} style={tw`absolute top-0 right-0 p-4`}>
            {/* <TouchableOpacity onPress={(e) => {console.log(e)}} style={tw`absolute top-0 right-0 p-4`}> */}
        <Entypo name="dots-three-vertical" size={20} color="black" />
      </TouchableOpacity>
    </View>
  ), []);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for cancellation');
      return;
    }
    try {
      await cancelOrderMutation.mutateAsync({ orderId: cancelOrderId, reason: cancelReason });
      Alert.alert('Success', 'Order cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      setMenuDialogOpen(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const handleRaiseComplaint = async () => {
    if (!complaintBody.trim()) {
      Alert.alert('Error', 'Please enter complaint details');
      return;
    }
    try {
      await raiseComplaintMutation.mutateAsync({ orderId: complaintOrderId, complaintBody: complaintBody.trim() });
      Alert.alert('Success', 'Complaint raised successfully');
      setComplaintDialogOpen(false);
      setComplaintBody('');
      setMenuDialogOpen(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to raise complaint');
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Error loading orders</Text>
      </View>
    );
  }



  return (
    <>
      <FlatList
        style={tw`flex-1 bg-white`}
        contentContainerStyle={tw`p-4`}
        data={orders}
        renderItem={({ item }) => renderOrder({ item })}
        keyExtractor={(item) => item.orderId}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={tw`text-center text-gray-500 mt-8`}>No orders available</Text>}
      />
      <BottomDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>All Items</Text>
          {dialogItems.map((product, index) => (
            <View key={index} style={tw`flex-row items-center mb-2`}>
              <Image source={{ uri: product.image || undefined }} style={tw`w-8 h-8 rounded mr-2`} />
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
          {(() => {
            const currentOrder = orders.find(o => o.orderId === menuOrderId);
            return currentOrder && currentOrder.orderStatus !== 'cancelled' ? (
              <TouchableOpacity onPress={() => { setCancelOrderId(menuOrderId); setCancelDialogOpen(true); setMenuDialogOpen(false); }}>
                <Text style={tw`text-sm py-2 text-red-500`}>Cancel Order</Text>
              </TouchableOpacity>
            ) : null;
          })()}
        </View>
      </BottomDialog>
      <BottomDialog open={complaintDialogOpen} onClose={() => setComplaintDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Raise Complaint for Order {complaintOrderId}</Text>
          <TextInput
            style={tw`border border-gray-300 rounded p-2 mb-4`}
            placeholder="Enter your complaint details"
            value={complaintBody}
            onChangeText={setComplaintBody}
            multiline
            numberOfLines={4}
          />
          <View style={tw`flex-row justify-end`}>
            <TouchableOpacity onPress={() => setComplaintDialogOpen(false)} style={tw`mr-4`}>
              <Text style={tw`text-gray-500`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRaiseComplaint} disabled={raiseComplaintMutation.isPending}>
              <Text style={tw`text-blue-500`}>{raiseComplaintMutation.isPending ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>
      <BottomDialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <View style={tw`p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Cancel Order {cancelOrderId}</Text>
          <TextInput
            style={tw`border border-gray-300 rounded p-2 mb-4`}
            placeholder="Enter reason for cancellation"
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
            numberOfLines={3}
          />
          <View style={tw`flex-row justify-end`}>
            <TouchableOpacity onPress={() => setCancelDialogOpen(false)} style={tw`mr-4`}>
              <Text style={tw`text-gray-500`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelOrder} disabled={cancelOrderMutation.isPending}>
              <Text style={tw`text-red-500`}>{cancelOrderMutation.isPending ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>
    </>
  );
}