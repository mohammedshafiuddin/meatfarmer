import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, theme, MyTextInput, AppContainer, useMarkDataFetchers, LoadingDialog } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { Checkbox } from 'common-ui';
import { BottomDropdown } from 'common-ui';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import AddressForm from '@/src/components/AddressForm';
import RazorpayCheckout from 'react-native-razorpay';

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



  const { data: couponsRaw } = trpc.user.coupon.getEligible.useQuery({});

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



  // Calculate coupon discount
  const selectedCoupons = useMemo(() =>
    eligibleCoupons?.filter(coupon => selectedCouponId.includes(coupon.id)),
    [eligibleCoupons, selectedCouponId]
  );

  const getItemDiscountInfo = (item: any) => {
    const quantity = item.quantity;
    const originalPrice = (item.product?.price || 0) * quantity;
    let discount = 0;
    const applicableCoupons = selectedCoupons.filter((coupon) => {
      // For checkout, assume all coupons apply to all items
      return true;
    });
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
      // For online payment, proceed to payment instead of navigating
      console.log({data})
      
      if (!data.data.isCod) {
        createRazorpayOrderMutation.mutate({ orderId: data.data.id.toString() });
      }
      else {
        router.replace(`/order-success?orderId=${data.data.id}`);
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

    setIsLoadingDialogOpen(true);
    const orderData = {
      selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      addressId: selectedAddress,
      slotId,
      paymentMethod: 'cod' as const,
      couponIds: selectedCouponId,
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

    setIsLoadingDialogOpen(true);
    const orderData = {
      selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      addressId: selectedAddress,
      slotId: Number(slotId!),
      paymentMethod: 'online' as const,
      couponIds: selectedCouponId,
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
         // Mark payment as failed
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
    <AppContainer>
      <View style={tw` py-4`}>

        {/* Order Summary */}
        <View style={tw`mb-6 bg-white rounded-lg p-4 shadow-md`}>
          <Text style={tw`text-lg font-semibold mb-3`}>Order Summary</Text>
          {selectedItems.map((item) => {
            const discountInfo = getItemDiscountInfo(item);
            return (
              <View key={item.id} style={tw`py-2 border-b border-gray-200`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`flex-1 text-base`}>{item.product.name} (x{item.quantity})</Text>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-base line-through text-gray-500`}>₹{item.subtotal}</Text>
                    <Text style={tw`font-semibold text-base`}>₹{discountInfo.discountedPrice}</Text>
                    {discountInfo.discountAmount > 0 && (
                      <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-sm text-pink1`}>Save ₹{discountInfo.discountAmount}</Text>
                        {discountInfo.couponCount > 0 && (
                          <TouchableOpacity
                            onPress={() => {
                              setItemCoupons(selectedCoupons);
                              setShowCouponDialog(true);
                            }}
                          >
                            <Text style={tw`text-sm text-pink1 underline ml-2`}>
                              {discountInfo.couponCount} coupon{discountInfo.couponCount > 1 ? 's' : ''} applied
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
           <View style={tw`flex-row justify-between mt-3`}>
             <Text style={tw`text-lg font-bold`}>Subtotal</Text>
             <Text style={tw`text-lg font-semibold`}>₹{totalAmount}</Text>
           </View>

            {selectedCoupons && selectedCoupons.length > 0 && discountAmount > 0 && (
              selectedCoupons.map(coupon => {
                const couponDiscount = coupon.discountType === 'percentage'
                  ? Math.min((totalAmount * coupon.discountValue) / 100, coupon.maxValue || Infinity)
                  : Math.min(coupon.discountValue, coupon.maxValue || totalAmount);
                return (
                  <View key={coupon.id} style={tw`flex-row justify-between mt-2`}>
                    <Text style={tw`text-pink1 font-medium`}>Discount ({coupon.code})</Text>
                    <Text style={tw`text-pink1 font-medium`}>-₹{couponDiscount}</Text>
                  </View>
                );
              })
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
                value={selectedCouponId}
                multiple={true}
                onValueChange={(value) => {
                  const newSelected = value as number[];
                  const selectedCoupons = eligibleCoupons.filter(c => newSelected.includes(c.id));
                  const exclusiveCoupons = selectedCoupons.filter(c => c.exclusiveApply);

                  if (exclusiveCoupons.length > 0 && newSelected.length > 1) {
                    // Keep only the exclusive coupon(s)
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
               <View style={tw`mt-3 p-3 bg-pink-50 border border-pink-200 rounded`}>
                 <Text style={tw`text-pink1 text-sm font-medium`}>
                   🎉 You save ₹{discountAmount} with {selectedCoupons.map(c => c.code).join(', ')}
                 </Text>
               </View>
             )}

            <TouchableOpacity
              style={tw`mt-3`}
              onPress={() => setSelectedCouponId([])}
            >
              <Text style={tw`text-gray-500 text-sm underline`}>Remove all coupons</Text>
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

         <LoadingDialog
           open={isLoadingDialogOpen}
           message="Placing your order..."
         />

         <BottomDialog
           open={showCouponDialog}
           onClose={() => setShowCouponDialog(false)}
         >
           <View style={tw`p-6`}>
             <Text style={tw`text-lg font-bold text-gray-800 mb-6`}>
               Applied Coupons
             </Text>
             {itemCoupons.map((coupon) => (
               <View key={coupon.id} style={tw`mb-4 p-4 bg-gray-50 rounded-lg`}>
                 <Text style={tw`font-semibold text-gray-800`}>{coupon.code}</Text>
                 <Text style={tw`text-sm text-gray-600 mt-1`}>
                   {coupon.description}
                 </Text>
                 <Text style={tw`text-sm text-pink1 mt-1`}>
                   {coupon.discountType === "percentage"
                     ? `${coupon.discountValue}% off`
                     : `₹${coupon.discountValue} off`}
                   {coupon.maxValue && ` (max ₹${coupon.maxValue})`}
                 </Text>
               </View>
             ))}
           </View>
         </BottomDialog>
       </View>
     </AppContainer>
   );
 }