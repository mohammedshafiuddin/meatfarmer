import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, theme, MyTextInput, AppContainer } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { Checkbox } from 'common-ui';
import { BottomDropdown } from 'common-ui';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import AddressForm from '@/src/components/AddressForm';
import RazorpayCheckout from 'react-native-razorpay';
import { useGetEligibleCoupons, EligibleCoupon } from '@/src/api-hooks/coupon.api';
import { trpc } from '@/src/trpc-client';





export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: cartData } = trpc.user.cart.getCart.useQuery();
  const { data: addresses } = trpc.user.address.getUserAddresses.useQuery();
  const { data: slotsData } = trpc.user.slots.getSlots.useQuery();

  
  

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');

  const isAddressSelected = !!selectedAddress;

  const cartItems = cartData?.items || [];
  const selectedIds = params.selected ? (params.selected as string).split(',').map(Number) : [];
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));

  useEffect(() => {
    if (params.slot) {
      setSlotId(Number(params.slot));
    }
  }, [params.slot]);



  const totalAmount = useMemo(() =>
    selectedItems.reduce((sum, item) => sum + item.subtotal, 0),
    [selectedItems]
  );



  const { data: eligibleCouponsRaw } = trpc.user.coupon.getEligible.useQuery({
    orderAmount: totalAmount,
  });
  const eligibleCoupons: EligibleCoupon[] = eligibleCouponsRaw?.data || [];
  //  const { data: eligibleCoupons } = useGetEligibleCoupons(totalAmount);

    const dropdownData = useMemo(() =>
      eligibleCoupons?.map(coupon => {
        const discount = coupon.discountType === 'percentage'
          ? Math.min((totalAmount * coupon.discountValue) / 100, coupon.maxValue || Infinity)
          : Math.min(coupon.discountValue, coupon.maxValue || totalAmount);
        return {
          label: `${coupon.code} - ${coupon.description} (Save ₹${discount})`,
          value: coupon.id
        };
      }) || [],
      [eligibleCoupons, totalAmount]
    );

    // Auto-select first coupon when data loads (only if no coupon is selected)
  useEffect(() => {
    if (eligibleCoupons && eligibleCoupons.length > 0 && selectedCouponId === null) {
      setSelectedCouponId(eligibleCoupons[0].id);
    }
  }, [eligibleCoupons]);

  // Calculate coupon discount
  const selectedCoupon = useMemo(() =>
    eligibleCoupons?.find(coupon => coupon.id === selectedCouponId),
    [eligibleCoupons, selectedCouponId]
  );

  const discountAmount = useMemo(() => selectedCoupon ?
    selectedCoupon.discountType === 'percentage'
      ? Math.min((totalAmount * selectedCoupon.discountValue) / 100, selectedCoupon.maxValue || Infinity)
      : Math.min(selectedCoupon.discountValue, selectedCoupon.maxValue || totalAmount)
    : 0, [selectedCoupon, totalAmount]);

  const finalAmount = useMemo(() => totalAmount - discountAmount, [totalAmount, discountAmount]);

  const placeOrderMutation = trpc.user.order.placeOrder.useMutation({
    onSuccess: (data) => {
      // For online payment, proceed to payment instead of navigating
      if (data.data) {
        createRazorpayOrderMutation.mutate({ orderId: data.data.id.toString() });
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to place order');
    },
  });

  const createRazorpayOrderMutation = trpc.user.payment.createRazorpayOrder.useMutation({
    onSuccess: (paymentData) => {
      initiateRazorpayPayment(paymentData.razorpayOrderId, paymentData.key, finalAmount);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create payment order');
    },
  });

  const verifyPaymentMutation = trpc.user.payment.verifyPayment.useMutation({
    onSuccess: () => {
      router.replace(`/order-success?orderId=${placeOrderMutation.data?.data.id}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Payment verification failed');
    },
  });

  const handleCancel = () => {
    router.back();
  };

  const handleOrderCOD = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }
    if (!slotId) {
      Alert.alert('Error', 'Please select a delivery slot');
      return;
    }

    const orderData = {
      selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      addressId: selectedAddress,
      slotId,
      paymentMethod: 'cod' as const,
      couponId: selectedCouponId,
      userNotes: userNotes,
    };
    placeOrderMutation.mutate(orderData);
  };

  const handleOrderOnline = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }
    if (!slotId) {
      Alert.alert('Error', 'Please select a delivery slot');
      return;
    }

    const orderData = {
      selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      addressId: selectedAddress,
      slotId: Number(slotId!),
      paymentMethod: 'online' as const,
      couponId: selectedCouponId,
      userNotes: userNotes,
    };
    placeOrderMutation.mutate(orderData);
  };

  const initiateRazorpayPayment = (razorpayOrderId: string, key: string, amount: number) => {
    const options = {
      key,
      amount: amount * 100, // in paisa
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'Meat Farmer',
      description: 'Order Payment',
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
      });
  };

  return (
    <AppContainer>
      <View style={tw`px-5 py-4`}>

        {/* Order Summary */}
        <View style={tw`mb-6 bg-white rounded-lg p-4 shadow-md`}>
          <Text style={tw`text-lg font-semibold mb-3`}>Order Summary</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={tw`flex-row justify-between py-2 border-b border-gray-200`}>
              <Text style={tw`flex-1 text-base`}>{item.product.name} (x{item.quantity})</Text>
              <Text style={tw`font-semibold text-base`}>₹{item.subtotal}</Text>
            </View>
          ))}
           <View style={tw`flex-row justify-between mt-3`}>
             <Text style={tw`text-lg font-bold`}>Subtotal</Text>
             <Text style={tw`text-lg font-semibold`}>₹{totalAmount}</Text>
           </View>

           {selectedCoupon && discountAmount > 0 && (
             <View style={tw`flex-row justify-between mt-2`}>
               <Text style={tw`text-pink1 font-medium`}>Discount ({selectedCoupon.code})</Text>
               <Text style={tw`text-pink1 font-medium`}>-₹{discountAmount}</Text>
             </View>
           )}

           <View style={tw`flex-row justify-between mt-3 border-t border-gray-300 pt-3`}>
             <Text style={tw`text-xl font-bold`}>Total</Text>
             <Text style={tw`text-xl font-bold`}>₹{finalAmount}</Text>
           </View>
           {slotId && (
             <Text style={tw`text-sm text-gray-600 mt-2`}>
               Delivery Slot: {slotsData?.slots?.find(slot => slot.id === slotId)?.deliveryTime
                 ? dayjs((slotsData as any)?.slots?.find((slot:any) => slot.id === slotId).deliveryTime).format('ddd DD MMM, h:mm a')
                 : 'Loading slot details...'}
             </Text>
           )}
        </View>

        {/* Coupon Selection */}
        {eligibleCoupons && eligibleCoupons.length > 0 && (
          <View style={tw`mb-6 bg-white rounded-lg p-4 shadow-md`}>
            <Text style={tw`text-lg font-semibold mb-3`}>Apply Coupon</Text>
            <BottomDropdown
              label="Available Coupons"
              options={dropdownData}
              value={selectedCouponId || ''}
              onValueChange={(value) => setSelectedCouponId(value ? Number(value) : null)}
              placeholder="Select a coupon"
            />

            {selectedCoupon && discountAmount > 0 && (
              <View style={tw`mt-3 p-3 bg-pink-50 border border-pink-200 rounded`}>
                <Text style={tw`text-pink1 text-sm font-medium`}>
                  🎉 You save ₹{discountAmount} with {selectedCoupon.code}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={tw`mt-3`}
              onPress={() => setSelectedCouponId(null)}
            >
              <Text style={tw`text-gray-500 text-sm underline`}>Remove coupon</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Selection */}
        <View style={tw`mb-6 bg-white rounded-lg p-4 shadow-md`}>
          <Text style={tw`text-lg font-semibold mb-3`}>Select Address</Text>
          {(!addresses?.data || addresses?.data.length === 0) ? (
            <Text style={tw`text-center text-gray-500 mb-2`}>No addresses found</Text>
          ) : (
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={true}>
              {addresses.data.map((address) => {
                const addressText = `${address.name}, ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${address.city}, ${address.state} - ${address.pincode}, ${address.phone}${address.isDefault ? ' (Default)' : ''}`;
                return (
                  <View
                    key={address.id}
                    style={tw`p-3 mx-2 border rounded-lg mb-3 flex-row items-center ${selectedAddress === address.id ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                  >
                    <Checkbox
                      checked={selectedAddress === address.id}
                      onPress={() => setSelectedAddress(address.id)}
                      style={tw`mr-3`}
                    />
                    <Text style={tw`flex-1 text-base`}>{addressText}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity style={tw`mt-4`} onPress={() => setShowAddAddress(true)}>
            <Text style={[tw`text-center font-medium`, { color: theme.colors.pink1 }]}>Add New Address</Text>
          </TouchableOpacity>
         </View>

         {/* Special Instructions */}
         <View style={tw`mb-6 bg-white rounded-lg p-4 shadow-md`}>
           <Text style={tw`text-lg font-semibold mb-3`}>Special Instructions (Optional)</Text>
           <MyTextInput
             style={tw`border border-gray-300 rounded-lg p-3 min-h-20 text-base`}
             value={userNotes}
             onChangeText={setUserNotes}
             placeholder="Any special delivery instructions, preferences, or notes..."
             multiline
             numberOfLines={3}
             textAlignVertical="top"
           />
          </View>

          {!isAddressSelected && (
            <View style={tw`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg`}>
              <Text style={tw`text-red-600 text-sm font-medium`}>Please select address to proceed</Text>
            </View>
          )}

          {/* Action Buttons */}
         <View style={tw`mt-6`}>
            <TouchableOpacity
              style={[tw`p-2 rounded-lg mb-4 w-full items-center`, {
                backgroundColor: isAddressSelected ? theme.colors.pink1 : '#9ca3af'
              }]}
              disabled={!isAddressSelected}
              onPress={handleOrderCOD}
            >
              <Text style={tw`text-white text-lg font-bold`}>Order with Cash On Delivery</Text>
            </TouchableOpacity>

           <TouchableOpacity
             style={[tw`p-2 rounded-lg mb-4 w-full items-center`, {
               backgroundColor: isAddressSelected ? theme.colors.pink1 : '#9ca3af'
             }]}
             disabled={!isAddressSelected}
             onPress={handleOrderOnline}
           >
             <Text style={tw`text-white text-lg font-bold`}>Pay Online and Order</Text>
           </TouchableOpacity>

           <TouchableOpacity
             style={tw`bg-gray-600 p-2 rounded-lg w-full items-center`}
             onPress={handleCancel}
           >
             <Text style={tw`text-white text-lg font-bold`}>Cancel</Text>
           </TouchableOpacity>
         </View>

        <BottomDialog open={showAddAddress} onClose={() => setShowAddAddress(false)}>
          <AddressForm
            onSuccess={() => {
              setShowAddAddress(false);
              // Invalidate tRPC query for addresses
              queryClient.invalidateQueries();
            }}
          />
        </BottomDialog>
      </View>
    </AppContainer>
  );
}