import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { tw, useMarkDataFetchers } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { useQueryClient } from '@tanstack/react-query';
import AddressForm from '@/src/components/AddressForm';

import { trpc } from '@/src/trpc-client';
import AddressSelector from '@/components/AddressSelector';
import PaymentAndOrderComponent from '@/components/PaymentAndOrderComponent';

export default function Checkout() {
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
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);



  const cartItems = cartData?.items || [];

  // Parse slots parameter from URL (format: "1:1,2,3;2:4,5")
  const selectedSlots = useMemo(() => {
    const slots: Record<number, number> = {};
    if (params.slots) {
      const slotGroups = (params.slots as string).split(';');
      slotGroups.forEach(group => {
        const [slotIdStr, itemIdsStr] = group.split(':');
        const slotId = Number(slotIdStr);
        const itemIds = itemIdsStr.split(',').map(Number);
        itemIds.forEach(itemId => {
          slots[itemId] = slotId;
        });
      });
    }
    return slots;
  }, [params.slots]);

  const selectedItems = cartItems.filter(item => selectedSlots[item.id]);

  React.useEffect(() => {
    if (params.coupons) {
      const couponId = Number(params.coupons as string);
      setSelectedCouponId(couponId);
    }
  }, [params.coupons]);

  const totalPrice = selectedItems
    .filter((item) => !item.product?.isOutOfStock)
    .reduce((sum, item) => {
      const quantity = item.quantity;
      return sum + (item.product?.price || 0) * quantity;
    }, 0);

  const { data: couponsRaw } = trpc.user.coupon.getEligible.useQuery();

  const eligibleCoupons = useMemo(() => {
    if (!couponsRaw?.data) return [];
    return couponsRaw.data.map(coupon => {
      let isEligible = true;
      let ineligibilityReason = '';
      if (coupon.maxLimitForUser && coupon.usages.length >= coupon.maxLimitForUser) {
        isEligible = false;
        ineligibilityReason = 'Usage limit exceeded';
      }
      if (coupon.minOrder && parseFloat(coupon.minOrder) > totalPrice) {
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
        description: '',
        exclusiveApply: coupon.exclusiveApply,
        isEligible,
        ineligibilityReason: isEligible ? undefined : ineligibilityReason,
      };
    }).filter(coupon => coupon.ineligibilityReason !== 'Usage limit exceeded');
  }, [couponsRaw, totalPrice]);

  const selectedCoupons = useMemo(
    () =>
      selectedCouponId ? eligibleCoupons?.filter((coupon) => coupon.id === selectedCouponId) : [],
    [eligibleCoupons, selectedCouponId]
  );

  const discountAmount = useMemo(
    () =>
      selectedCoupons?.reduce(
        (sum, coupon) =>
          sum +
          (coupon.discountType === "percentage"
            ? Math.min(
                (totalPrice * coupon.discountValue) / 100,
                coupon.maxValue || Infinity
              )
            : Math.min(coupon.discountValue, coupon.maxValue || totalPrice)),
        0
      ) || 0,
    [selectedCoupons, totalPrice]
  );

  const finalTotal = totalPrice - discountAmount;





  return (
    <View style={tw`flex-1 bg-gray-50`}>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-32`}
        showsVerticalScrollIndicator={false}
      >
        <AddressSelector
          selectedAddress={selectedAddress}
          onAddressSelect={setSelectedAddress}
        />

        <PaymentAndOrderComponent
          selectedAddress={selectedAddress}
          selectedSlots={selectedSlots}
          selectedCouponId={selectedCouponId}
          cartItems={selectedItems}
          totalPrice={totalPrice}
          discountAmount={discountAmount}
          finalTotal={finalTotal}
          selectedCoupons={selectedCoupons}
        />
      </ScrollView>



      <BottomDialog open={showAddAddress} onClose={() => setShowAddAddress(false)}>
        <AddressForm
          onSuccess={() => {
            setShowAddAddress(false);
            queryClient.invalidateQueries();
          }}
        />
      </BottomDialog>
    </View>
  );
}