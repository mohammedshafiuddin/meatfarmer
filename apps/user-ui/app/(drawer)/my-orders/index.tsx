import React, { useState, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { tw, useManualRefresh, MyText, AppContainer } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { useGetUserOrders, useCancelOrder, useRaiseComplaint } from '../../../src/api-hooks/order.api';
import { trpc } from '@/src/trpc-client';

export default function MyOrders() {
  const { data: ordersData, isLoading, error, refetch } = useGetUserOrders();
  const cancelOrderMutation = useCancelOrder();
  // const raiseComplaintMutation = useRaiseComplaint();
  const raiseComplaintMutation = trpc.user.complaint.raise.useMutation();
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'check-circle', color: '#16A34A' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', color: '#DC2626' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'schedule', color: '#D97706' };
      case 'processing':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'hourglass-empty', color: '#2563EB' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'info', color: '#6B7280' };
    }
  };

  const renderOrder = useCallback(({ item }: { item: typeof orders[0] }) => {
    const statusConfig = getStatusColor(item.orderStatus);
    const totalAmount = item.items.reduce((sum, p) => sum + p.amount, 0);

    return (
      <View style={tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}>
        {/* Header with Order ID and Status */}
        <View style={tw`flex-row justify-between items-start mb-4`}>
          <View>
            <MyText style={tw`text-lg font-bold text-gray-800`}>Order #{item.orderId}</MyText>
            <MyText style={tw`text-sm text-gray-500 mt-1`}>
              {new Date(item.orderDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </MyText>
          </View>

          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-row items-center ${statusConfig.bg} px-3 py-1 rounded-full mr-3`}>
              <MaterialIcons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <MyText style={tw`text-xs font-semibold ${statusConfig.text} ml-1 capitalize`}>
                {item.orderStatus}
              </MyText>
            </View>

            <TouchableOpacity
              onPress={() => { setMenuOrderId(item.orderId); setMenuDialogOpen(true); }}
              style={tw`p-2 rounded-full bg-gray-50`}
            >
              <Entypo name="dots-three-vertical" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Details */}
        <View style={tw`flex-row justify-between mb-4`}>
          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="local-shipping" size={16} color="#6B7280" />
            <MyText style={tw`text-sm text-gray-600 ml-2 capitalize`}>
              {item.deliveryStatus}
            </MyText>
          </View>

          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="payment" size={16} color="#6B7280" />
            <MyText style={tw`text-sm text-gray-600 ml-2 capitalize`}>
              {item.paymentMode}
            </MyText>
          </View>
        </View>

        {/* Cancel/Refund Info */}
        {item.cancelReason && (
          <View style={tw`bg-red-50 p-3 rounded-lg mb-4`}>
            <MyText style={tw`text-sm text-red-700 font-medium`}>Cancel Reason:</MyText>
            <MyText style={tw`text-sm text-red-600 mt-1`}>{item.cancelReason}</MyText>
            {item.orderStatus === 'cancelled' && item.isRefundDone && (
              <View style={tw`flex-row items-center mt-2`}>
                <MaterialIcons name="check-circle" size={14} color="#16A34A" />
                <MyText style={tw`text-sm text-green-700 ml-1`}>Refund Processed</MyText>
              </View>
            )}
          </View>
        )}

        {/* Items Preview */}
        <View style={tw`mb-4`}>
          <MyText style={tw`text-sm font-semibold text-gray-800 mb-2`}>Items</MyText>
          {item.items.slice(0, 2).map((product, index) => (
            <View key={index} style={tw`flex-row items-center mb-2`}>
              <Image
                source={{ uri: product.image || undefined }}
                style={tw`w-10 h-10 rounded-lg mr-3 bg-gray-100`}
                defaultSource={require('@/assets/logo.png')}
              />
              <View style={tw`flex-1`}>
                <MyText style={tw`text-sm font-medium text-gray-800`} numberOfLines={1}>
                  {product.productName}
                </MyText>
                <MyText style={tw`text-xs text-gray-500`}>
                  Qty: {product.quantity} × ₹{product.price}
                </MyText>
              </View>
              <MyText style={tw`text-sm font-semibold text-gray-800`}>
                ₹{product.amount}
              </MyText>
            </View>
          ))}

          {item.items.length > 2 && (
            <TouchableOpacity
              onPress={() => openDialog(item.items)}
              style={tw`flex-row items-center mt-2`}
            >
              <MyText style={tw`text-sm text-blue-600 font-medium`}>
                +{item.items.length - 2} more items
              </MyText>
              <MaterialIcons name="chevron-right" size={16} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>

        {/* Total Amount */}
        <View style={tw`flex-row justify-between items-center pt-4 border-t border-gray-100`}>
          <MyText style={tw`text-lg font-bold text-gray-800`}>Total</MyText>
          <MyText style={tw`text-xl font-bold text-gray-800`}>₹{totalAmount}</MyText>
        </View>
      </View>
    );
  }, []);

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
      console.log(error)
      
      Alert.alert('Error', 'Failed to raise complaint');
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <MyText style={tw`text-gray-600 mt-4`}>Loading your orders...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <MyText style={tw`text-gray-800 text-lg font-semibold mt-4`}>Unable to load orders</MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>Please check your connection and try again</MyText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={tw`bg-blue-500 px-6 py-3 rounded-lg mt-4`}
          >
            <MyText style={tw`text-white font-semibold`}>Retry</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }



  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        <View style={tw`px-6 py-4`}>
          <MyText style={tw`text-2xl font-bold text-gray-800`}>My Orders</MyText>
          <MyText style={tw`text-gray-600 mt-1`}>Track your order history</MyText>
        </View>

        <FlatList
          style={tw`flex-1`}
          contentContainerStyle={tw`px-6 pb-6`}
          data={orders}
          renderItem={({ item }) => renderOrder({ item })}
          keyExtractor={(item) => item.orderId}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center py-12`}>
              <MaterialIcons name="shopping-bag" size={64} color="#D1D5DB" />
              <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>No orders yet</MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>Your order history will appear here</MyText>
            </View>
          }
        />
      </View>
    </AppContainer>
  );
}