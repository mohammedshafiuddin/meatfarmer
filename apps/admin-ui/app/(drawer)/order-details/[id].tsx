import React from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: orderData, isLoading, error } = trpc.admin.order.getOrderDetails.useQuery(
    { orderId: id ? parseInt(id) : 0 },
    { enabled: !!id }
  );
  
  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading order details...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error || !orderData) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <MyText style={tw`text-red-500 text-lg font-semibold mt-4`}>Error</MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>
            {error?.message || 'Failed to load order details'}
          </MyText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-medium`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  const order = orderData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
      case 'delivered':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' };
      case 'pending':
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
    }
  };

  const statusBadge = getStatusBadge(order.status);

  return (
    <AppContainer>
        {/* Order Header */}
        <View style={tw`bg-white p-4 mb-4`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <MyText style={tw`text-xl font-bold text-gray-800`}>
              Order #{order.readableId}
            </MyText>
            <View style={tw`${statusBadge.bg} px-3 py-1 rounded-full`}>
              <MyText style={tw`${statusBadge.text} text-sm font-medium`}>{statusBadge.label}</MyText>
            </View>
          </View>
          <MyText style={tw`text-gray-600`}>
            {dayjs(order.createdAt).format('DD MMM YYYY, h:mm A')}
          </MyText>
        </View>

        {/* Customer Information */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Customer Details</MyText>
          <MyText style={tw`text-gray-700 font-medium mb-1`}>{order.customerName}</MyText>
          <MyText style={tw`text-gray-600 text-sm mb-1`}>{order.customerEmail}</MyText>
          <MyText style={tw`text-gray-600 text-sm`}>{order.customerMobile}</MyText>
          <View style={tw`mt-2`}>
            <MyText style={tw`text-gray-700 font-medium mb-1`}>Delivery Address:</MyText>
            <MyText style={tw`text-gray-600 text-sm`}>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ''}
              {`, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
            </MyText>
          </View>
        </View>

        {/* Order Status Details - Show for pending and delivered orders */}
        {(order.status === 'pending' || order.status === 'delivered') && (
          <View style={tw`bg-white p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Order Status</MyText>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <MyText style={tw`text-gray-700`}>Packaged:</MyText>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-2 h-2 rounded-full mr-2 ${
                  order.isPackaged ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <MyText style={tw`text-gray-600`}>
                  {order.isPackaged ? 'Yes' : 'No'}
                </MyText>
              </View>
            </View>
            <View style={tw`flex-row justify-between items-center`}>
              <MyText style={tw`text-gray-700`}>Delivered:</MyText>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-2 h-2 rounded-full mr-2 ${
                  order.isDelivered ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <MyText style={tw`text-gray-600`}>
                  {order.isDelivered ? 'Yes' : 'No'}
                </MyText>
              </View>
            </View>
          </View>
        )}

        {/* Cancellation Details - Only show for cancelled orders */}
        {order.status === 'cancelled' && (
          <View style={tw`bg-white p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Cancellation Details</MyText>
            {order.cancelReason && (
              <View style={tw`mb-3`}>
                <MyText style={tw`text-gray-700 font-medium mb-1`}>Reason:</MyText>
                <MyText style={tw`text-gray-600`}>{order.cancelReason}</MyText>
              </View>
            )}
            <View style={tw`flex-row justify-between items-center`}>
              <View>
                <MyText style={tw`text-gray-700 font-medium mb-1`}>Refund Status:</MyText>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-2 h-2 rounded-full mr-2 ${
                    order.isRefundDone ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <MyText style={tw`text-gray-600`}>
                    {order.isRefundDone ? 'Completed' : 'Pending'}
                  </MyText>
                </View>
              </View>
              <View style={tw`items-end`}>
                <MyText style={tw`text-gray-700 font-medium mb-1`}>Reviewed:</MyText>
                <MyText style={tw`text-gray-600`}>
                  {order.cancellationReviewed ? 'Yes' : 'No'}
                </MyText>
              </View>
            </View>
            {order.refundAmount && (
              <View style={tw`flex-row items-center mt-3 pt-3 border-t border-gray-200`}>
                <MyText style={tw`text-gray-700 font-medium mr-2`}>Refund Amount:</MyText>
                <MyText style={tw`text-green-600 font-semibold`}>₹{order.refundAmount}</MyText>
              </View>
            )}
          </View>
        )}

        {/* Order Items */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Order Items</MyText>
            {order.items.map((item, index) => (
              <View key={index} style={tw`flex-row items-center py-3 border-b border-gray-100 ${
                index === order.items.length - 1 ? 'border-b-0' : ''
              }`}>
               <View style={tw`flex-1`}>
                 <MyText style={tw`text-gray-800 font-medium`}>{item.name}</MyText>
                 <MyText style={tw`text-gray-600 text-sm`}>
                   {item.quantity} {item.unit} × ₹{item.price}
                 </MyText>
               </View>
               <MyText style={tw`text-gray-800 font-semibold`}>₹{item.amount}</MyText>
             </View>
           ))}
        </View>

        {/* Order Summary */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Order Summary</MyText>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <MyText style={tw`text-gray-700`}>Total Amount:</MyText>
            <MyText style={tw`text-gray-800 font-semibold`}>₹{order.totalAmount}</MyText>
          </View>
        </View>

        {/* Admin Notes */}
        {order.adminNotes && (
          <View style={tw`bg-white p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Admin Notes</MyText>
            <View style={tw`bg-gray-50 p-3 rounded-lg`}>
              <MyText style={tw`text-gray-700`}>{order.adminNotes}</MyText>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={tw`flex-row justify-between px-4 mb-8`}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`bg-gray-500 px-6 py-3 rounded-lg flex-1 mr-2 items-center`}
          >
            <MyText style={tw`text-white font-semibold`}>Back to Orders</MyText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(drawer)/manage-orders')}
            style={tw`bg-blue-500 px-6 py-3 rounded-lg flex-1 ml-2 items-center`}
          >
            <MyText style={tw`text-white font-semibold`}>Manage Orders</MyText>
          </TouchableOpacity>
        </View>

    </AppContainer>
  );
}