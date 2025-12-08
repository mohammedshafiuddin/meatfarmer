import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Entypo, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { tw, useManualRefresh, MyText, MyFlatList, useMarkDataFetchers, REFUND_STATUS } from 'common-ui';
import { BottomDialog } from 'common-ui';

import { trpc } from '@/src/trpc-client';
import RazorpayCheckout from 'react-native-razorpay';
import ComplaintForm from '@/components/ComplaintForm';

// Type definitions
interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  image: string | null;
}

interface Order {
  id: number;
  orderId: string;
  orderDate: string;
  deliveryStatus: string;
  deliveryDate?: string;
  orderStatus: string;
  cancelReason: string | null;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  refundStatus: string;
  refundAmount: number | null;
  userNotes: string | null;
  items: OrderItem[];
  discountAmount?: number;
}

export default function MyOrders() {
  const router = useRouter();

  // Infinite scroll state
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const pageSize = 10;

  const { data: ordersData, isLoading, error, refetch } = trpc.user.order.getOrders.useQuery({
    page: currentPage,
    pageSize: pageSize,
  });

  const cancelOrderMutation = trpc.user.order.cancelOrder.useMutation();

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

  const createRazorpayOrderMutation = trpc.user.payment.createRazorpayOrder.useMutation({
    onSuccess: (paymentData) => {
      const order = allOrders.find(o => o.id === retryOrderId);
      if (order) {
        const totalAmount = order.items.reduce((sum, p) => sum + p.amount, 0);
        initiateRazorpayPayment(paymentData.razorpayOrderId, paymentData.key, totalAmount);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create payment order');
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
  // Handle data accumulation for infinite scroll
  useEffect(() => {
    if (ordersData?.data) {
      if (currentPage === 1) {
        // First page - replace all orders
        setAllOrders(ordersData.data);
      } else {
        // Subsequent pages - append to existing orders
        setAllOrders(prev => [...prev, ...ordersData.data]);
      }

      // Check if there are more pages
      const totalPages = ordersData.pagination?.totalPages || 1;
      setHasNextPage(currentPage < totalPages);
      setIsLoadingMore(false);
      setLoadMoreError(null); // Clear any previous errors
    }
  }, [ordersData, currentPage]);

  // Handle errors during infinite scroll loading
  useEffect(() => {
    if (error && currentPage > 1) {
      // If there's an error loading more pages, show error state
      setIsLoadingMore(false);
      setLoadMoreError('Failed to load more orders. Please try again.');
    }
  }, [error, currentPage]);

  // Reset to first page on manual refresh
  useManualRefresh(() => {
    setCurrentPage(1);
    setAllOrders([]);
    setHasNextPage(true);
    setIsLoadingMore(false);
    setLoadMoreError(null);
    refetch();
  });

  useMarkDataFetchers(() => {
    setCurrentPage(1);
    setAllOrders([]);
    setHasNextPage(true);
    setIsLoadingMore(false);
    setLoadMoreError(null);
    refetch();
  });

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogItems, setDialogItems] = useState<OrderItem[]>([]);
  const [menuDialogOpen, setMenuDialogOpen] = useState<boolean>(false);
  const [menuOrderId, setMenuOrderId] = useState<string>('');
  const [complaintDialogOpen, setComplaintDialogOpen] = useState<boolean>(false);
   const [complaintOrderId, setComplaintOrderId] = useState<string>('');
   const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
   const [cancelOrderId, setCancelOrderId] = useState<string>('');
   const [cancelReason, setCancelReason] = useState<string>('');
  const [editNotesDialogOpen, setEditNotesDialogOpen] = useState<boolean>(false);
  const [editNotesOrderId, setEditNotesOrderId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [retryOrderId, setRetryOrderId] = useState<number>(0);

  const openDialog = useCallback((items: OrderItem[]) => {
    setDialogItems(items);
    setDialogOpen(true);
  }, []);

  // Infinite scroll functions
  const loadMoreOrders = useCallback(() => {
    if (!isLoadingMore && hasNextPage && !isLoading) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasNextPage, isLoading]);

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={tw`py-6 items-center`}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <MyText style={tw`text-gray-500 mt-2 text-sm`}>Loading more orders...</MyText>
        </View>
      );
    }

    if (loadMoreError) {
      return (
        <View style={tw`py-6 items-center`}>
          <MyText style={tw`text-red-500 text-sm mb-2`}>{loadMoreError}</MyText>
          <TouchableOpacity
            onPress={() => {
              setLoadMoreError(null);
              loadMoreOrders();
            }}
            style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-medium text-sm`}>Retry</MyText>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasNextPage && allOrders.length > 0) {
      return (
        <View style={tw`py-6 items-center`}>
          <MyText style={tw`text-gray-400 text-xs`}>End of list</MyText>
        </View>
      );
    }

    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'check-circle', color: '#16A34A', border: 'border-green-200' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', color: '#DC2626', border: 'border-red-200' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'schedule', color: '#D97706', border: 'border-yellow-200' };
      case 'processing':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'hourglass-empty', color: '#2563EB', border: 'border-blue-200' };
      case 'success':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'check-circle', color: '#16A34A', border: 'border-green-200' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'error', color: '#DC2626', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'info', color: '#6B7280', border: 'border-gray-200' };
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case REFUND_STATUS.SUCCESS:
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'check-circle', color: '#16A34A' };
      case REFUND_STATUS.PROCESSING:
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'hourglass-empty', color: '#2563EB' };
      case REFUND_STATUS.PENDING:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'schedule', color: '#D97706' };
      case REFUND_STATUS.NOT_APPLICABLE:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'info', color: '#6B7280' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'info', color: '#6B7280' };
    }
  };

  const renderOrder = useCallback(({ item }: { item: Order }) => {
    const statusConfig = getStatusColor(item.orderStatus);
    const totalAmount = item.totalAmount;

    return (
      <TouchableOpacity
        style={tw`bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden`}
        onPress={() => router.push(`/(drawer)/(tabs)/me/my-orders/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={tw`flex-row justify-between items-center p-4 bg-gray-50 border-b border-gray-100`}>
          <View>
            <MyText style={tw`text-base font-bold text-gray-900`}>Order #{item.orderId}</MyText>
            <MyText style={tw`text-xs text-gray-500 mt-0.5`}>
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
            <View style={tw`flex-row items-center ${statusConfig.bg} px-2.5 py-1 rounded-full border ${statusConfig.border} mr-2`}>
              <MaterialIcons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <MyText style={tw`text-xs font-bold ${statusConfig.text} ml-1 capitalize`}>
                {item.orderStatus}
              </MyText>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setMenuOrderId(item.id.toString());
                setMenuDialogOpen(true);
              }}
              style={tw`p-1.5 rounded-full bg-white border border-gray-200`}
            >
              <Entypo name="dots-three-vertical" size={14} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`p-4`}>
          {/* Items Preview */}
          <View style={tw`mb-4`}>
            {item.items.slice(0, 2).map((product, index) => (
              <View key={index} style={tw`flex-row items-center mb-3 last:mb-0`}>
                <Image
                  source={{ uri: product.image || undefined }}
                  style={tw`w-12 h-12 rounded-lg bg-gray-100 border border-gray-100`}
                  defaultSource={require('@/assets/logo.png')}
                />
                <View style={tw`flex-1 ml-3`}>
                  <MyText style={tw`text-sm font-medium text-gray-800 leading-tight`} numberOfLines={1}>
                    {product.productName}
                  </MyText>
                  <View style={tw`flex-row items-center mt-1`}>
                    <MyText style={tw`text-xs text-gray-500`}>
                      {product.quantity} x
                    </MyText>
                    <MyText style={tw`text-xs font-medium text-gray-900 ml-1`}>
                      ₹{product.price}
                    </MyText>
                  </View>
                </View>
                <MyText style={tw`text-sm font-bold text-gray-900`}>
                  ₹{product.amount}
                </MyText>
              </View>
            ))}

            {item.items.length > 2 && (
              <MyText style={tw`text-xs text-blue-600 font-medium mt-1 ml-1`}>
                +{item.items.length - 2} more items...
              </MyText>
            )}
          </View>

          {/* Info Badges */}
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            <View style={tw`flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100`}>
              <MaterialIcons name="local-shipping" size={12} color="#6B7280" />
              <MyText style={tw`text-xs text-gray-600 ml-1 capitalize`}>
                {item.deliveryStatus}
              </MyText>
            </View>
            {item.paymentMode !== 'COD' && (
              <View style={tw`flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100`}>
                <MaterialIcons name="payment" size={12} color="#6B7280" />
                <MyText style={tw`text-xs text-gray-600 ml-1 capitalize`}>
                  {item.paymentMode}
                </MyText>
              </View>
            )}
            {item.paymentMode === 'Online' && (
              <View style={tw`flex-row items-center ${getStatusColor(item.paymentStatus).bg} px-2 py-1 rounded-md border ${getStatusColor(item.paymentStatus).border}`}>
                <MyText style={tw`text-xs font-medium ${getStatusColor(item.paymentStatus).text} capitalize`}>
                  {item.paymentStatus}
                </MyText>
              </View>
            )}
          </View>

          {/* Alerts/Notes */}
          {item.userNotes && (
            <View style={tw`bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100`}>
              <View style={tw`flex-row items-center mb-1`}>
                <MaterialIcons name="note" size={14} color="#2563EB" />
                <MyText style={tw`text-xs text-blue-700 font-bold ml-1`}>Note:</MyText>
              </View>
              <MyText style={tw`text-xs text-blue-600 leading-relaxed`}>{item.userNotes}</MyText>
            </View>
          )}

          {item.cancelReason && (
            <View style={tw`bg-red-50 p-3 rounded-lg mb-3 border border-red-100`}>
              
              <View style={tw`flex-row items-center mb-1`}>
                <MaterialIcons name="info" size={14} color="#DC2626" />
                <MyText style={tw`text-xs text-red-700 font-bold ml-1`}>Cancelled:</MyText>
              </View>
              <MyText style={tw`text-xs text-red-600 leading-relaxed`}>{item.cancelReason}</MyText>
              {item.orderStatus === 'cancelled' && item.refundStatus && (
                <View style={tw`flex-row items-center mt-2 bg-white self-start px-2 py-1 rounded border border-red-100`}>
                  <MaterialIcons name={getRefundStatusColor(item.refundStatus).icon as any} size={12} color={getRefundStatusColor(item.refundStatus).color} />
                  <MyText style={tw`text-xs font-medium ${getRefundStatusColor(item.refundStatus).text} ml-1 capitalize`}>
                    Refund {item.refundStatus === REFUND_STATUS.PENDING ? 'Pending' : item.refundStatus === REFUND_STATUS.NOT_APPLICABLE ? 'N/A' : item.refundStatus === REFUND_STATUS.PROCESSING ? 'Processing' : 'Success'}
                  </MyText>
                </View>
              )}
            </View>
          )}

           {/* Footer Actions */}
           <View style={tw`flex-row justify-between items-center pt-3 border-t border-gray-100`}>
             <View>
               <MyText style={tw`text-xs text-gray-500`}>Total Amount</MyText>
               <MyText style={tw`text-lg font-bold text-gray-900`}>₹{totalAmount}</MyText>
               {item.discountAmount && item.discountAmount > 0 && (
                 <MyText style={tw`text-xs text-green-600`}>Saved ₹{item.discountAmount}</MyText>
               )}
             </View>

            {(item.paymentMode === 'Online' && (item.paymentStatus === 'pending' || item.paymentStatus === 'failed')) ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRetryPayment(item.id);
                }}
                disabled={createRazorpayOrderMutation.isPending}
                style={tw`bg-pink-600 px-4 py-2 rounded-lg shadow-sm flex-row items-center`}
              >
                {createRazorpayOrderMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
                ) : (
                  <MaterialIcons name="refresh" size={16} color="white" style={tw`mr-1`} />
                )}
                <MyText style={tw`text-white font-bold text-sm`}>
                  Retry Payment
                </MyText>
              </TouchableOpacity>
            ) : (
              <View style={tw`flex-row items-center`}>
                <MyText style={tw`text-sm text-blue-600 font-medium mr-1`}>View Details</MyText>
                <MaterialIcons name="chevron-right" size={16} color="#2563EB" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
    createRazorpayOrderMutation.mutate({ orderId: orderId.toString() });
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
        Alert.alert('Payment Failed', 'Payment failed. Please try again.');
        refetch();
      });
  };

  if (isLoading && currentPage === 1) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <MyText style={tw`text-gray-500 mt-4 font-medium`}>Loading your orders...</MyText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-6`}>
        <View style={tw`bg-white p-6 rounded-full shadow-sm mb-4`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        </View>
        <MyText style={tw`text-gray-900 text-xl font-bold mt-2`}>Unable to load orders</MyText>
        <MyText style={tw`text-gray-500 text-center mt-2 mb-6`}>Please check your connection and try again</MyText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={tw`bg-blue-600 px-8 py-3 rounded-full shadow-md`}
        >
          <MyText style={tw`text-white font-bold`}>Retry</MyText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 py-6`}
        data={allOrders}
        renderItem={({ item }) => renderOrder({ item })}
        keyExtractor={(item) => item.orderId}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-20`}>
            <View style={tw`bg-white p-6 rounded-full shadow-sm mb-4`}>
              <MaterialIcons name="shopping-bag" size={64} color="#E5E7EB" />
            </View>
            <MyText style={tw`text-gray-900 text-lg font-bold mt-2`}>No orders yet</MyText>
            <MyText style={tw`text-gray-500 text-center mt-2`}>Your order history will appear here</MyText>
            <TouchableOpacity
              style={tw`mt-6 bg-blue-600 px-6 py-3 rounded-full`}
              onPress={() => router.push('/(drawer)/(tabs)/home')}
            >
              <MyText style={tw`text-white font-bold`}>Start Shopping</MyText>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Menu Dialog */}
      <BottomDialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)}>
        <View style={tw`pb-8 pt-2 px-4`}>
          {/* Handle */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-12 h-1.5 bg-gray-200 rounded-full mb-4`} />
            <MyText style={tw`text-lg font-bold text-gray-900`}>Order Options</MyText>
            <MyText style={tw`text-sm text-gray-500`}>Select an action for Order #{menuOrderId}</MyText>
          </View>

          <View style={tw`space-y-3`}>
            <TouchableOpacity
              style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm`}
              onPress={() => {
                const order = allOrders.find(o => o.orderId === menuOrderId);
                if (order) {
                  setEditNotes(order.userNotes || '');
                  setEditNotesOrderId(menuOrderId);
                  setEditNotesDialogOpen(true);
                }
              }}
            >
              <View style={tw`w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4`}>
                <MaterialIcons name="edit" size={20} color="#2563EB" />
              </View>
              <View style={tw`flex-1`}>
                <MyText style={tw`text-gray-900 font-semibold text-base`}>Edit Notes</MyText>
                <MyText style={tw`text-gray-500 text-xs`}>Add special instructions</MyText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm`}
              onPress={() => {
                setComplaintOrderId(menuOrderId);
                setComplaintDialogOpen(true);
              }}
            >
              <View style={tw`w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mr-4`}>
                <MaterialIcons name="report-problem" size={20} color="#D97706" />
              </View>
              <View style={tw`flex-1`}>
                <MyText style={tw`text-gray-900 font-semibold text-base`}>Raise Complaint</MyText>
                <MyText style={tw`text-gray-500 text-xs`}>Report an issue with this order</MyText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm`}
              onPress={() => {
                setCancelOrderId(menuOrderId);
                setCancelDialogOpen(true);
              }}
            >
              <View style={tw`w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4`}>
                <MaterialIcons name="cancel" size={20} color="#DC2626" />
              </View>
              <View style={tw`flex-1`}>
                <MyText style={tw`text-gray-900 font-semibold text-base`}>Cancel Order</MyText>
                <MyText style={tw`text-gray-500 text-xs`}>Request order cancellation</MyText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>

      {/* Edit Notes Dialog */}
      <BottomDialog open={editNotesDialogOpen} onClose={() => setEditNotesDialogOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={tw`p-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <MyText style={tw`text-xl font-bold text-gray-900`}>Edit Instructions</MyText>
              <TouchableOpacity onPress={() => setEditNotesDialogOpen(false)}>
                <MaterialIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-32 text-base text-gray-800 mb-6`}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Add special delivery instructions here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={tw`bg-blue-600 py-4 rounded-xl shadow-sm items-center ${updateNotesMutation.isPending ? 'opacity-70' : ''}`}
              onPress={handleEditNotes}
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <MyText style={tw`text-white font-bold text-lg`}>Save Instructions</MyText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomDialog>

      {/* Cancel Order Dialog */}
      <BottomDialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={tw`p-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <MyText style={tw`text-xl font-bold text-gray-900`}>Cancel Order</MyText>
              <TouchableOpacity onPress={() => setCancelDialogOpen(false)}>
                <MaterialIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={tw`bg-red-50 p-4 rounded-xl mb-4 border border-red-100`}>
              <MyText style={tw`text-red-800 text-sm`}>
                Are you sure you want to cancel this order? This action cannot be undone.
              </MyText>
            </View>

            <MyText style={tw`text-gray-700 font-medium mb-2`}>Reason for cancellation</MyText>
            <TextInput
              style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-24 text-base text-gray-800 mb-6`}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Please tell us why you are cancelling..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={tw`bg-red-600 py-4 rounded-xl shadow-sm items-center ${cancelOrderMutation.isPending ? 'opacity-70' : ''}`}
              onPress={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <MyText style={tw`text-white font-bold text-lg`}>Confirm Cancellation</MyText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomDialog>

      {/* Raise Complaint Dialog */}
      <BottomDialog open={complaintDialogOpen} onClose={() => setComplaintDialogOpen(false)}>
        <ComplaintForm
          open={complaintDialogOpen}
          onClose={() => setComplaintDialogOpen(false)}
          orderId={complaintOrderId}
        />
      </BottomDialog>
    </View>
  );
}