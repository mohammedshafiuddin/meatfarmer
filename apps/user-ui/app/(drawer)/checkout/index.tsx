import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, Image, StatusBar, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, theme, MyTextInput, AppContainer, useMarkDataFetchers, LoadingDialog } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { Checkbox } from 'common-ui';
import { BottomDropdown } from 'common-ui';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import AddressForm from '@/src/components/AddressForm';
import RazorpayCheckout from 'react-native-razorpay';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { trpc } from '@/src/trpc-client';

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: cartData, refetch: refetchCart } = trpc.user.cart.getCart.useQuery();
  const { data: addresses, refetch: refetchAddresses } = trpc.user.address.getUserAddresses.useQuery();
  const { data: slotsData, refetch: refetchSlots } = trpc.user.slots.getSlots.useQuery();

  useMarkDataFetchers(() => {
    refetchCart();
    refetchAddresses();
    refetchSlots();
  });

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [itemCoupons, setItemCoupons] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  const isAddressSelected = !!selectedAddress;

  const cartItems = cartData?.items || [];
  const selectedIds = params.selected ? (params.selected as string).split(',').map(Number) : [];
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));

  useEffect(() => {
    if (params.slot) {
      setSlotId(Number(params.slot));
    }
  }, [params.slot]);

  useEffect(() => {
    if (params.coupons) {
      const couponIds = (params.coupons as string).split(',').map(Number);
      setSelectedCouponId(couponIds);
    }
  }, [params.coupons]);

  const totalAmount = useMemo(() =>
    selectedItems.reduce((sum, item) => sum + item.subtotal, 0),
    [selectedItems]
  );

  const { data: couponsRaw } = trpc.user.coupon.getEligible.useQuery();

  const generateCouponDescription = (coupon: any): string => {
    let desc = '';
    if (coupon.discountPercent) {
      desc += `${coupon.discountPercent}% off`;
    } else if (coupon.flatDiscount) {
      desc += `₹${coupon.flatDiscount} off`;
    }
    if (coupon.minOrder) {
      desc += ` on orders above ₹${coupon.minOrder}`;
    }
    if (coupon.maxValue) {
      desc += ` (max discount ₹${coupon.maxValue})`;
    }
    return desc;
  };

  const eligibleCoupons = useMemo(() => {
    if (!couponsRaw?.data) return [];
    return couponsRaw.data.map(coupon => {
      let isEligible = true;
      let ineligibilityReason = '';
      if (coupon.maxLimitForUser && coupon.usages.length >= coupon.maxLimitForUser) {
        isEligible = false;
        ineligibilityReason = 'Usage limit exceeded';
      }
      if (coupon.minOrder && parseFloat(coupon.minOrder) > totalAmount) {
        isEligible = false;
        ineligibilityReason = `Min order ₹${coupon.minOrder}`;
      }
      return {
        id: coupon.id,
        code: coupon.couponCode,
        discountType: coupon.discountPercent ? 'percentage' : 'flat',
        discountValue: parseFloat(coupon.discountPercent || coupon.flatDiscount || '0'),
        maxValue: coupon.maxValue ? parseFloat(coupon.maxValue) : undefined,
        minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
        description: generateCouponDescription(coupon),
        exclusiveApply: coupon.exclusiveApply,
        isEligible,
        ineligibilityReason: isEligible ? undefined : ineligibilityReason,
      };
    }).filter(coupon => coupon.ineligibilityReason !== 'Usage limit exceeded');
  }, [couponsRaw, totalAmount]);

  const dropdownData = useMemo(() =>
    eligibleCoupons?.map(coupon => {
      const discount = coupon.discountType === 'percentage'
        ? Math.min((totalAmount * coupon.discountValue) / 100, coupon.maxValue || Infinity)
        : Math.min(coupon.discountValue, coupon.maxValue || totalAmount);
      const baseLabel = `${coupon.code} - ${coupon.description} (Save ₹${discount})`;
      const label = coupon.isEligible ? baseLabel : `${baseLabel} (${coupon.ineligibilityReason})`;
      return {
        label,
        value: coupon.id,
        disabled: !coupon.isEligible,
      };
    }) || [],
    [eligibleCoupons, totalAmount]
  );

  const selectedCoupons = useMemo(() =>
    eligibleCoupons?.filter(coupon => selectedCouponId.includes(coupon.id)),
    [eligibleCoupons, selectedCouponId]
  );

  const getItemDiscountInfo = (item: any) => {
    const quantity = item.quantity;
    const originalPrice = (item.product?.price || 0) * quantity;
    let discount = 0;
    const applicableCoupons = selectedCoupons.filter((coupon) => true);
    applicableCoupons.forEach((coupon) => {
      if (coupon.discountType === "percentage") {
        discount += Math.min(
          (originalPrice * coupon.discountValue) / 100,
          coupon.maxValue || Infinity
        );
      } else {
        discount += Math.min(
          coupon.discountValue,
          coupon.maxValue || originalPrice
        );
      }
    });
    const discountedPrice = Math.max(0, originalPrice - discount);
    return {
      discountedPrice,
      discountAmount: discount,
      couponCount: applicableCoupons.length,
    };
  };

  const discountAmount = useMemo(() => selectedCoupons?.reduce((sum, coupon) =>
    sum + (coupon.discountType === 'percentage'
      ? Math.min((totalAmount * coupon.discountValue) / 100, coupon.maxValue || Infinity)
      : Math.min(coupon.discountValue, coupon.maxValue || totalAmount)), 0) || 0, [selectedCoupons, totalAmount]);

  const finalAmount = useMemo(() => totalAmount - discountAmount, [totalAmount, discountAmount]);

  const placeOrderMutation = trpc.user.order.placeOrder.useMutation({
    onSuccess: (data) => {
      router.replace(`/order-success?orderId=${data.data.id}`);
      // if (!data.data.isCod) {
      //   createRazorpayOrderMutation.mutate({ orderId: data.data.id.toString() });
      // } else {
      //   router.replace(`/order-success?orderId=${data.data.id}`);
      // }
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

  const markPaymentFailedMutation = trpc.user.payment.markPaymentFailed.useMutation();

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }
    if (!slotId) {
      Alert.alert('Error', 'Please select a delivery slot');
      return;
    }

    setIsLoadingDialogOpen(true);
    const orderData = {
      selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      addressId: selectedAddress,
      slotId: Number(slotId!),
      paymentMethod: paymentMethod,
      couponIds: selectedCouponId,
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
                const orderId = placeOrderMutation.data?.data.id.toString();
                if (orderId) {
                  createRazorpayOrderMutation.mutate({ orderId });
                }
              }
            },
            {
              text: 'Retry Later',
              onPress: () => router.push('/(drawer)/my-orders')
            }
          ]
        );
      });
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-32`}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address Section */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-3 px-1`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddAddress(true)}>
              <Text style={tw`text-pink1 font-bold text-sm`}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {(!addresses?.data || addresses?.data.length === 0) ? (
            <View style={tw`bg-white p-6 rounded-2xl border border-gray-200 items-center justify-center border-dashed`}>
              <MaterialIcons name="location-off" size={32} color="#9CA3AF" />
              <Text style={tw`text-gray-500 mt-2`}>No addresses found</Text>
              <TouchableOpacity onPress={() => setShowAddAddress(true)} style={tw`mt-3 bg-pink1 px-4 py-2 rounded-lg`}>
                <Text style={tw`text-white font-bold text-sm`}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`pb-2`}>
              {addresses.data.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  onPress={() => setSelectedAddress(address.id)}
                  style={tw`w-72 p-4 mr-3 bg-white rounded-2xl border-2 ${selectedAddress === address.id ? 'border-pink1 bg-pink-50' : 'border-gray-100'
                    } shadow-sm`}
                >
                  <View style={tw`flex-row justify-between items-start mb-2`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialIcons
                        name={address.name.toLowerCase().includes('home') ? 'home' : address.name.toLowerCase().includes('work') ? 'work' : 'location-on'}
                        size={20}
                        color={selectedAddress === address.id ? '#EC4899' : '#6B7280'}
                      />
                      <Text style={tw`font-bold ml-2 ${selectedAddress === address.id ? 'text-pink1' : 'text-gray-900'}`}>
                        {address.name}
                      </Text>
                    </View>
                    {selectedAddress === address.id && (
                      <View style={tw`bg-pink1 w-5 h-5 rounded-full items-center justify-center`}>
                        <MaterialIcons name="check" size={14} color="white" />
                      </View>
                    )}
                  </View>
                  <Text style={tw`text-gray-600 text-sm leading-5 mb-1`} numberOfLines={2}>
                    {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm mb-1`}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs mt-2`}>
                    Phone: {address.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Delivery Slot Info */}
        {slotId && slotsData && (
          <View style={tw`bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex-row items-center`}>
            <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={tw`text-blue-900 font-bold text-sm`}>Delivery Slot</Text>
              <Text style={tw`text-blue-700 text-sm`}>
                {slotsData?.slots?.find(slot => slot.id === slotId)?.deliveryTime
                  ? dayjs((slotsData as any)?.slots?.find((slot: any) => slot.id === slotId).deliveryTime).format('ddd DD MMM, h:mm a')
                  : 'Loading...'}
              </Text>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Order Items ({selectedItems.length})</Text>
          {selectedItems.map((item, index) => {
            const discountInfo = getItemDiscountInfo(item);
            return (
              <View key={item.id} style={tw`flex-row items-start ${index !== selectedItems.length - 1 ? 'mb-4 border-b border-gray-100 pb-4' : ''}`}>
                <Image
                  source={{ uri: item.product?.images?.[0] }}
                  style={tw`w-16 h-16 rounded-lg bg-gray-100 mr-3`}
                />
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-900 font-bold text-base mb-1`}>{item.product.name}</Text>
                  <Text style={tw`text-gray-500 text-sm`}>Quantity: {item.quantity}</Text>

                  <View style={tw`flex-row justify-between items-center mt-2`}>
                    <View style={tw`flex-row items-baseline`}>
                      <Text style={tw`text-gray-900 font-bold`}>₹{discountInfo.discountedPrice}</Text>
                      {discountInfo.discountAmount > 0 && (
                        <Text style={tw`text-xs text-gray-400 line-through ml-2`}>₹{item.subtotal}</Text>
                      )}
                    </View>
                    {discountInfo.discountAmount > 0 && (
                      <Text style={tw`text-xs text-green-600 font-bold`}>Saved ₹{discountInfo.discountAmount}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupons */}
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-8 h-8 bg-pink-50 rounded-full items-center justify-center mr-3`}>
              <MaterialIcons name="local-offer" size={18} color="#EC4899" />
            </View>
            <Text style={tw`text-base font-bold text-gray-900`}>Offers & Coupons</Text>
          </View>

          <BottomDropdown
            label="Available Coupons"
            options={dropdownData}
            value={selectedCouponId}
            multiple={true}
            onValueChange={(value) => {
              const newSelected = value as number[];
              const selectedCoupons = eligibleCoupons.filter(c => newSelected.includes(c.id));
              const exclusiveCoupons = selectedCoupons.filter(c => c.exclusiveApply);

              if (exclusiveCoupons.length > 0 && newSelected.length > 1) {
                const exclusiveIds = exclusiveCoupons.map(c => c.id);
                setSelectedCouponId(exclusiveIds);
                Alert.alert(
                  'Exclusive Coupon',
                  'Exclusive coupons cannot be combined with others. Other coupons have been removed.'
                );
              } else {
                setSelectedCouponId(newSelected);
              }
            }}
            placeholder="Select coupons"
          />

          {selectedCoupons && selectedCoupons.length > 0 && discountAmount > 0 && (
            <View style={tw`mt-3 p-3 bg-green-50 border border-green-100 rounded-xl flex-row items-center`}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" style={tw`mr-2`} />
              <Text style={tw`text-green-700 text-sm font-bold flex-1`}>
                You saved ₹{discountAmount} with {selectedCoupons.map(c => c.code).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Special Instructions */}
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100`}>
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
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Payment Method</Text>

          <TouchableOpacity
            onPress={() => setPaymentMethod('online')}
            style={tw`flex-row items-center p-4 rounded-xl border mb-3 ${paymentMethod === 'online' ? 'border-pink1 bg-pink-50' : 'border-gray-200'}`}
          >
            <View style={tw`w-5 h-5 rounded-full border-2 ${paymentMethod === 'online' ? 'border-pink1' : 'border-gray-400'} items-center justify-center mr-3`}>
              {paymentMethod === 'online' && <View style={tw`w-2.5 h-2.5 rounded-full bg-pink1`} />}
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
            style={tw`flex-row items-center p-4 rounded-xl border ${paymentMethod === 'cod' ? 'border-pink1 bg-pink-50' : 'border-gray-200'}`}
          >
            <View style={tw`w-5 h-5 rounded-full border-2 ${paymentMethod === 'cod' ? 'border-pink1' : 'border-gray-400'} items-center justify-center mr-3`}>
              {paymentMethod === 'cod' && <View style={tw`w-2.5 h-2.5 rounded-full bg-pink1`} />}
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
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Bill Details</Text>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-gray-600`}>Subtotal</Text>
            <Text style={tw`text-gray-900 font-medium`}>₹{totalAmount}</Text>
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
            <Text style={tw`text-lg font-bold text-gray-900`}>₹{finalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-${Platform.OS === 'ios' ? '8' : '4'} shadow-lg`}>
        <TouchableOpacity
          style={tw`bg-pink1 py-4 rounded-xl items-center shadow-md ${!isAddressSelected ? 'opacity-50' : ''}`}
          disabled={!isAddressSelected}
          onPress={handlePlaceOrder}
        >
          <Text style={tw`text-white font-bold text-lg`}>
            {paymentMethod === 'online' ? `Pay ₹${finalAmount}` : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomDialog open={showAddAddress} onClose={() => setShowAddAddress(false)}>
        <AddressForm
          onSuccess={() => {
            setShowAddAddress(false);
            queryClient.invalidateQueries();
          }}
        />
      </BottomDialog>

      <LoadingDialog
        open={isLoadingDialogOpen}
        message="Placing your order..."
      />
    </View>
  );
}