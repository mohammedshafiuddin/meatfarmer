import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { tw, MyTextInput, LoadingDialog } from 'common-ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';

import { trpc } from '@/src/trpc-client';

interface PaymentAndOrderProps {
  selectedAddress: number | null;
  selectedSlots: Record<number, number>;
  selectedCouponId: number | null;
  cartItems: any[];
  totalPrice: number;
  discountAmount: number;
  finalTotal: number;
  selectedCoupons: any[];
  onCancel?: () => void;
}

const PaymentAndOrderComponent: React.FC<PaymentAndOrderProps> = ({
  selectedAddress,
  selectedSlots,
  selectedCouponId,
  cartItems,
  totalPrice,
  discountAmount,
  finalTotal,
  selectedCoupons,
  onCancel,
}) => {
  const router = useRouter();
  const [userNotes, setUserNotes] = useState('');
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  const placeOrderMutation = trpc.user.order.placeOrder.useMutation({
    onSuccess: (data) => {
      const orders = data.data; // Now an array of orders
      const firstOrder = orders[0]; // Use first order for payment flow

      if (!firstOrder.isCod) {
        createRazorpayOrderMutation.mutate({ orderId: firstOrder.id.toString() });
      } else {
        router.replace(`./order-success?orderId=${firstOrder.id}`);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to place order');
    },
    onSettled: () => {
      setIsLoadingDialogOpen(false);
    },
  });

  const createRazorpayOrderMutation = trpc.user.payment.createRazorpayOrder.useMutation({
    onSuccess: (paymentData) => {
      initiateRazorpayPayment(paymentData.razorpayOrderId, paymentData.key, finalTotal);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create payment order');
    },
  });

  const verifyPaymentMutation = trpc.user.payment.verifyPayment.useMutation({
    onSuccess: () => {
      const orders = placeOrderMutation.data?.data || [];
      const firstOrder = orders[0];
      router.replace(`./order-success?orderId=${firstOrder?.id}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Payment verification failed');
    },
  });

  const markPaymentFailedMutation = trpc.user.payment.markPaymentFailed.useMutation();

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }

    const availableItems = cartItems
      .filter(item => !item.product?.isOutOfStock && selectedSlots[item.id])
      .map(item => item.id);

    if (availableItems.length === 0) {
      Alert.alert('Error', 'No valid items to order');
      return;
    }

    setIsLoadingDialogOpen(true);

    const orderData = {
      selectedItems: availableItems.map(itemId => {
        const item = cartItems.find(cartItem => cartItem.id === itemId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          slotId: selectedSlots[itemId]
        };
      }),
      addressId: selectedAddress,
      paymentMethod: paymentMethod,
      couponId: selectedCouponId || undefined,
      userNotes: userNotes,
    };

    placeOrderMutation.mutate(orderData);
  };

  const initiateRazorpayPayment = (razorpayOrderId: string, key: string, amount: number) => {
    const options = {
      key,
      amount: amount * 100,
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'Meat Farmer',
      description: 'Order Payment',
      prefill: {},
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        verifyPaymentMutation.mutate({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
      })
      .catch((error: any) => {
        markPaymentFailedMutation.mutate({ merchantOrderId: razorpayOrderId });
        Alert.alert(
          'Payment Failed',
          'Payment failed or was cancelled. What would you like to do?',
          [
            {
              text: 'Retry Now',
              onPress: () => {
                const orders = placeOrderMutation.data?.data || [];
                const firstOrder = orders[0];
                const orderId = firstOrder?.id.toString();
                if (orderId) {
                  createRazorpayOrderMutation.mutate({ orderId });
                }
              }
            },
            {
              text: 'Retry Later',
              onPress: () => router.push('/(drawer)/(tabs)/me/my-orders')
            }
          ]
        );
      });
  };

  return (
    <>
      {/* Back Button */}
      {onCancel && (
        <View style={tw`bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
          <TouchableOpacity
            onPress={onCancel}
            style={tw`flex-row items-center`}
          >
            <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
            <Text style={tw`text-gray-600 ml-2 font-medium`}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Special Instructions */}
      <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
        <Text style={tw`text-base font-bold text-gray-900 mb-3`}>Delivery Instructions</Text>
        <MyTextInput
          style={tw`border border-gray-200 rounded-xl p-3 min-h-24 text-base bg-gray-50`}
          value={userNotes}
          onChangeText={setUserNotes}
          placeholder="Any special instructions for the delivery partner..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Payment Method */}
      <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
        <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Payment Method</Text>

        <TouchableOpacity
          onPress={() => setPaymentMethod('online')}
          style={tw`flex-row items-center p-4 rounded-xl border mb-3 ${paymentMethod === 'online' ? 'border-brand500 bg-blue-50' : 'border-gray-200'}`}
        >
          <View style={tw`w-5 h-5 rounded-full border-2 ${paymentMethod === 'online' ? 'border-brand500' : 'border-gray-400'} items-center justify-center mr-3`}>
            {paymentMethod === 'online' && <View style={tw`w-2.5 h-2.5 rounded-full bg-brand500`} />}
          </View>
          <View style={tw`w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-3`}>
            <MaterialIcons name="payment" size={20} color="#6366F1" />
          </View>
          <View>
            <Text style={tw`font-bold text-gray-900`}>Pay Online</Text>
            <Text style={tw`text-xs text-gray-500`}>UPI, Cards, Netbanking</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPaymentMethod('cod')}
          style={tw`flex-row items-center p-4 rounded-xl border ${paymentMethod === 'cod' ? 'border-brand500 bg-blue-50' : 'border-gray-200'}`}
        >
          <View style={tw`w-5 h-5 rounded-full border-2 ${paymentMethod === 'cod' ? 'border-brand500' : 'border-gray-400'} items-center justify-center mr-3`}>
            {paymentMethod === 'cod' && <View style={tw`w-2.5 h-2.5 rounded-full bg-brand500`} />}
          </View>
          <View style={tw`w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3`}>
            <MaterialIcons name="attach-money" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={tw`font-bold text-gray-900`}>Cash on Delivery</Text>
            <Text style={tw`text-xs text-gray-500`}>Pay when you receive</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bill Details */}
      <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
        <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Bill Details</Text>
        <View style={tw`flex-row justify-between mb-2`}>
          <Text style={tw`text-gray-600`}>Subtotal</Text>
          <Text style={tw`text-gray-900 font-medium`}>₹{totalPrice}</Text>
        </View>
        {discountAmount > 0 && (
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-green-600`}>Discount</Text>
            <Text style={tw`text-green-600 font-medium`}>-₹{discountAmount}</Text>
          </View>
        )}
        <View style={tw`h-px bg-gray-100 my-3`} />
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>To Pay</Text>
          <Text style={tw`text-lg font-bold text-gray-900`}>₹{finalTotal}</Text>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={tw`bg-white border-t border-gray-100 p-4 pb-${Platform.OS === 'ios' ? '8' : '4'} shadow-lg`}>
        <TouchableOpacity
          style={tw`bg-brand500 py-4 rounded-xl items-center shadow-md ${!selectedAddress ? 'opacity-50' : ''}`}
          disabled={!selectedAddress}
          onPress={handlePlaceOrder}
        >
          <Text style={tw`text-white font-bold text-lg`}>
            {paymentMethod === 'online' ? `Pay ₹${finalTotal}` : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>

      <LoadingDialog
        open={isLoadingDialogOpen}
        message="Placing your order..."
      />
    </>
  );
};

export default PaymentAndOrderComponent;