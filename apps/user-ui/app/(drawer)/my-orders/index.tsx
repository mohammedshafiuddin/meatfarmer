import React, { useState, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { tw, useManualRefresh, MyText, MyFlatList } from 'common-ui';
import { BottomDialog } from 'common-ui';

import { trpc } from '@/src/trpc-client';
import RazorpayCheckout from 'react-native-razorpay';

export default function MyOrders() {
  const { data: ordersData, isLoading, error, refetch } = trpc.user.order.getOrders.useQuery();
  
  const cancelOrderMutation = trpc.user.order.cancelOrder.useMutation();
  const raiseComplaintMutation = trpc.user.complaint.raise.useMutation();
  const updateNotesMutation = trpc.user.order.updateUserNotes.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Notes updated successfully');
      setEditNotesDialogOpen(false);
      setEditNotes('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update notes');
    },
  });

  const retryPaymentMutation = trpc.user.payment.retryPayment.useMutation({
    onSuccess: (paymentData) => {
      const order = orders.find(o => o.id === retryOrderId);
      if (order) {
        const totalAmount = order.items.reduce((sum, p) => sum + p.amount, 0);
        initiateRazorpayPayment(paymentData.razorpayOrderId, paymentData.key, totalAmount);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to retry payment');
    },
  });

  const verifyPaymentMutation = trpc.user.payment.verifyPayment.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Payment completed successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Payment verification failed');
      refetch();
    },
  });
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
  const [editNotesDialogOpen, setEditNotesDialogOpen] = useState(false);
  const [editNotesOrderId, setEditNotesOrderId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [retryOrderId, setRetryOrderId] = useState<number>(0);

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
      case 'success':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'check-circle', color: '#16A34A' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'error', color: '#DC2626' };
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
             {item.orderStatus === 'cancelled' && (
               <View style={tw`flex-row items-center ${statusConfig.bg} px-3 py-1 rounded-full mr-3`}>
                 <MaterialIcons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                 <MyText style={tw`text-xs font-semibold ${statusConfig.text} ml-1 capitalize`}>
                   {item.orderStatus}
                 </MyText>
               </View>
             )}

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

           {item.paymentMode !== 'COD' && (
             <View style={tw`flex-row items-center`}>
               <MaterialIcons name="payment" size={16} color="#6B7280" />
               <MyText style={tw`text-sm text-gray-600 ml-2 capitalize`}>
                 {item.paymentMode}
               </MyText>
             </View>
           )}
         </View>

        {/* Payment Status */}
        {item.paymentMode === 'Online' && (
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="credit-card" size={16} color="#6B7280" />
              <MyText style={tw`text-sm text-gray-600 ml-2`}>Payment: </MyText>
              <View style={tw`flex-row items-center ml-1 ${getStatusColor(item.paymentStatus).bg} px-2 py-1 rounded-full`}>
                <MaterialIcons name={getStatusColor(item.paymentStatus).icon as any} size={12} color={getStatusColor(item.paymentStatus).color} />
                <MyText style={tw`text-xs font-semibold ${getStatusColor(item.paymentStatus).text} ml-1 capitalize`}>
                  {item.paymentStatus}
                </MyText>
              </View>
            </View>
            {(item.paymentStatus === 'pending' || item.paymentStatus === 'failed') && (
              <TouchableOpacity onPress={() => handleRetryPayment(item.id)} disabled={retryPaymentMutation.isPending}>
                <MyText style={tw`text-pink1 font-medium ${retryPaymentMutation.isPending ? 'opacity-50' : ''}`}>
                  {retryPaymentMutation.isPending ? 'Retrying...' : 'Retry'}
                </MyText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* User Notes */}
        {item.userNotes && (
          <View style={tw`bg-blue-50 p-3 rounded-lg mb-4`}>
            <MyText style={tw`text-sm text-blue-700 font-medium`}>Special Instructions:</MyText>
            <MyText style={tw`text-sm text-blue-600 mt-1`}>{item.userNotes}</MyText>
          </View>
        )}

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
      await cancelOrderMutation.mutateAsync({ id: cancelOrderId, reason: cancelReason });
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

  const handleEditNotes = async () => {
    try {
      await updateNotesMutation.mutateAsync({
        id: editNotesOrderId,
        userNotes: editNotes.trim()
      });
      setMenuDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation onError
    }
  };

  const handleRetryPayment = (orderId: number) => {
    setRetryOrderId(orderId);
    retryPaymentMutation.mutate({ orderId });
  };

  const initiateRazorpayPayment = (razorpayOrderId: string, key: string, amount: number) => {
    const options = {
      key,
      amount: amount * 100, // in paisa
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'Meat Farmer',
      description: 'Order Payment Retry',
      prefill: {
        // Add user details if available
      },
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        // Payment success
        verifyPaymentMutation.mutate({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
      })
      .catch((error: any) => {
        Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed');
        refetch();
      });
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <MyText style={tw`text-gray-600 mt-4`}>Loading your orders...</MyText>
      </View>
    );
  }

  if (error) {
    return (
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
    );
  }



  return (
    <View style={tw`flex-1`}>

      <MyFlatList
        style={tw`flex-1 bg-white`}
        contentContainerStyle={tw`px-4 pb-6`}
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

        {/* Menu Dialog */}
        <BottomDialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)}>
          <View style={tw`p-6`}>
            <MyText style={tw`text-xl font-bold text-gray-800 mb-6`}>Order Options</MyText>
             <View style={tw`space-y-4`}>
               <TouchableOpacity
                 style={tw`px-4 py-3 border-b border-gray-200 flex-row items-center`}
                 onPress={() => {
                   const order = orders.find(o => o.orderId === menuOrderId);
                   if (order) {
                     setEditNotes(order.userNotes || '');
                     setEditNotesOrderId(menuOrderId);
                     setEditNotesDialogOpen(true);
                   }
                 }}
               >
                 <MaterialIcons name="edit" size={20} color="#6B7280" style={tw`mr-3`} />
                 <MyText style={tw`text-gray-800 font-medium`}>Edit Notes</MyText>
               </TouchableOpacity>

               <TouchableOpacity
                 style={tw`px-4 py-3 border-b border-gray-200 flex-row items-center`}
                 onPress={() => {
                   setComplaintOrderId(menuOrderId);
                   setComplaintDialogOpen(true);
                 }}
               >
                 <MaterialIcons name="report-problem" size={20} color="#6B7280" style={tw`mr-3`} />
                 <MyText style={tw`text-gray-800 font-medium`}>Raise Complaint</MyText>
               </TouchableOpacity>

               <TouchableOpacity
                 style={tw`px-4 py-3 border-b border-gray-200 flex-row items-center`}
                 onPress={() => {
                   setCancelOrderId(menuOrderId);
                   setCancelDialogOpen(true);
                 }}
               >
                 <MaterialIcons name="cancel" size={20} color="#6B7280" style={tw`mr-3`} />
                 <MyText style={tw`text-gray-800 font-medium`}>Cancel Order</MyText>
               </TouchableOpacity>
             </View>
          </View>
        </BottomDialog>

        {/* Edit Notes Dialog */}
        <BottomDialog open={editNotesDialogOpen} onClose={() => setEditNotesDialogOpen(false)}>
          <View style={tw`p-6`}>
            <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Edit Special Instructions</MyText>
            <TextInput
              style={tw`border border-gray-300 rounded-lg p-3 min-h-20 text-base mb-4`}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Any special delivery instructions..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={tw`flex-row space-x-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-500 p-3 rounded-lg items-center`}
                onPress={() => setEditNotesDialogOpen(false)}
              >
                <MyText style={tw`text-white font-medium`}>Cancel</MyText>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-blue-500 p-3 rounded-lg items-center`}
                onPress={handleEditNotes}
                disabled={updateNotesMutation.isPending}
              >
                <MyText style={tw`text-white font-medium`}>
                  {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                </MyText>
              </TouchableOpacity>
            </View>
          </View>
        </BottomDialog>

        {/* Cancel Order Dialog */}
        <BottomDialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <View style={tw`p-6`}>
            <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Cancel Order</MyText>
            <MyText style={tw`text-gray-600 mb-4`}>Please provide a reason for cancellation:</MyText>
            <TextInput
              style={tw`border border-gray-300 rounded-lg p-3 min-h-20 text-base mb-4`}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={tw`flex-row space-x-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-500 p-3 rounded-lg items-center`}
                onPress={() => setCancelDialogOpen(false)}
              >
                <MyText style={tw`text-white font-medium`}>Cancel</MyText>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-red-500 p-3 rounded-lg items-center`}
                onPress={handleCancelOrder}
                disabled={cancelOrderMutation.isPending}
              >
                <MyText style={tw`text-white font-medium`}>
                  {cancelOrderMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </MyText>
              </TouchableOpacity>
            </View>
          </View>
        </BottomDialog>

        {/* Raise Complaint Dialog */}
        <BottomDialog open={complaintDialogOpen} onClose={() => setComplaintDialogOpen(false)}>
          <View style={tw`p-6`}>
            <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Raise Complaint</MyText>
            <MyText style={tw`text-gray-600 mb-4`}>Please describe your complaint:</MyText>
            <TextInput
              style={tw`border border-gray-300 rounded-lg p-3 min-h-20 text-base mb-4`}
              value={complaintBody}
              onChangeText={setComplaintBody}
              placeholder="Describe your complaint..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={tw`flex-row space-x-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-500 p-3 rounded-lg items-center`}
                onPress={() => setComplaintDialogOpen(false)}
              >
                <MyText style={tw`text-white font-medium`}>Cancel</MyText>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-yellow-500 p-3 rounded-lg items-center`}
                onPress={handleRaiseComplaint}
                disabled={raiseComplaintMutation.isPending}
              >
                <MyText style={tw`text-white font-medium`}>
                  {raiseComplaintMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
                </MyText>
              </TouchableOpacity>
            </View>
          </View>
        </BottomDialog>
    </View>
  );
}