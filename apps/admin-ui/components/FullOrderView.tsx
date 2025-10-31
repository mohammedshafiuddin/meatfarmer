import React from 'react';
import { View, ScrollView, Image, Dimensions } from 'react-native';
import { MyText, tw } from 'common-ui';
import { trpc } from '../src/trpc-client';

interface FullOrderViewProps {
  orderId: number;
}

export const FullOrderView: React.FC<FullOrderViewProps> = ({ orderId }) => {
  const { data: order, isLoading, error } = trpc.admin.order.getFullOrder.useQuery({ orderId });

  if (isLoading) {
    return (
      <View style={tw`p-6`}>
        <MyText style={tw`text-center text-gray-600`}>Loading order details...</MyText>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={tw`p-6`}>
        <MyText style={tw`text-center text-red-600`}>Failed to load order details</MyText>
      </View>
    );
  }

  const totalAmount = order.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView
      style={[tw`flex-1`, { maxHeight: Dimensions.get('window').height * 0.8 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`p-6`}>
        <MyText style={tw`text-2xl font-bold text-gray-800 mb-6`}>Order #{order.readableId}</MyText>

        {/* Customer Information */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Customer Details</MyText>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row justify-between`}>
              <MyText style={tw`text-gray-600`}>Name:</MyText>
              <MyText style={tw`font-medium`}>{order.customerName}</MyText>
            </View>
            {order.customerEmail && (
              <View style={tw`flex-row justify-between`}>
                <MyText style={tw`text-gray-600`}>Email:</MyText>
                <MyText style={tw`font-medium`}>{order.customerEmail}</MyText>
              </View>
            )}
            <View style={tw`flex-row justify-between`}>
              <MyText style={tw`text-gray-600`}>Mobile:</MyText>
              <MyText style={tw`font-medium`}>{order.customerMobile}</MyText>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Delivery Address</MyText>
          <View style={tw`space-y-1`}>
            <MyText style={tw`text-gray-800`}>{order.address.line1}</MyText>
            {order.address.line2 && <MyText style={tw`text-gray-800`}>{order.address.line2}</MyText>}
            <MyText style={tw`text-gray-800`}>
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </MyText>
            <MyText style={tw`text-gray-800`}>Phone: {order.address.phone}</MyText>
          </View>
        </View>

        {/* Order Details */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Order Details</MyText>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row justify-between`}>
              <MyText style={tw`text-gray-600`}>Order Date:</MyText>
              <MyText style={tw`font-medium`}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </MyText>
            </View>
            <View style={tw`flex-row justify-between`}>
              <MyText style={tw`text-gray-600`}>Payment Method:</MyText>
              <MyText style={tw`font-medium`}>
                {order.isCod ? 'Cash on Delivery' : 'Online Payment'}
              </MyText>
            </View>
            {order.slotInfo && (
              <View style={tw`flex-row justify-between`}>
                <MyText style={tw`text-gray-600`}>Delivery Slot:</MyText>
                <MyText style={tw`font-medium`}>
                  {new Date(order.slotInfo.time).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </MyText>
              </View>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Items ({order.items.length})</MyText>
          {order.items.map((item, index) => (
            <View key={item.id} style={tw`flex-row items-center py-3 ${index !== order.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <View style={tw`flex-1`}>
                <MyText style={tw`font-medium text-gray-800`} numberOfLines={2}>
                  {item.productName}
                </MyText>
                <MyText style={tw`text-sm text-gray-600`}>
                  Qty: {item.quantity} {item.unit} × ₹{parseFloat(item.price.toString()).toFixed(2)}
                </MyText>
              </View>
              <MyText style={tw`font-semibold text-gray-800`}>₹{item.amount.toFixed(2)}</MyText>
            </View>
          ))}
        </View>

        {/* Payment Information */}
        {(order.payment || order.paymentInfo) && (
          <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>Payment Information</MyText>
            {order.payment && (
              <View style={tw`space-y-2 mb-3`}>
                <MyText style={tw`text-sm font-medium text-gray-700`}>Payment Details:</MyText>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Status:</MyText>
                  <MyText style={tw`font-medium capitalize`}>{order.payment.status}</MyText>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Gateway:</MyText>
                  <MyText style={tw`font-medium`}>{order.payment.gateway}</MyText>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Order ID:</MyText>
                  <MyText style={tw`font-medium`}>{order.payment.merchantOrderId}</MyText>
                </View>
              </View>
            )}
            {order.paymentInfo && (
              <View style={tw`space-y-2`}>
                <MyText style={tw`text-sm font-medium text-gray-700`}>Payment Info:</MyText>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Status:</MyText>
                  <MyText style={tw`font-medium capitalize`}>{order.paymentInfo.status}</MyText>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Gateway:</MyText>
                  <MyText style={tw`font-medium`}>{order.paymentInfo.gateway}</MyText>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <MyText style={tw`text-gray-600`}>Order ID:</MyText>
                  <MyText style={tw`font-medium`}>{order.paymentInfo.merchantOrderId}</MyText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Admin Notes */}
        {order.adminNotes && (
          <View style={tw`bg-yellow-50 rounded-xl p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-2`}>Admin Notes</MyText>
            <MyText style={tw`text-gray-700`}>{order.adminNotes}</MyText>
          </View>
        )}

        {/* Total */}
        <View style={tw`bg-blue-50 rounded-xl p-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <MyText style={tw`text-xl font-bold text-gray-800`}>Total Amount</MyText>
            <MyText style={tw`text-2xl font-bold text-blue-600`}>₹{parseFloat(order.totalAmount.toString()).toFixed(2)}</MyText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};