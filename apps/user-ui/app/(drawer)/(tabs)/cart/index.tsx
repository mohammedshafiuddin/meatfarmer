import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  tw,
  useManualRefresh,
  AppContainer,
  useMarkDataFetchers,
} from "common-ui";
import { BottomDropdown, BottomDialog } from "common-ui";
import { Quantifier } from "common-ui";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import dayjs from "dayjs";
import { trpc } from "@/src/trpc-client";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    price: number;
    isOutOfStock: boolean;
    name: string;
    images: string[];
  } | null;
}



export default function MyCart() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const {
    data: cartData,
    isLoading,
    error,
    refetch,
  } = trpc.user.cart.getCart.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });
  const { data: slotsData, refetch: refetchSlots } =
    trpc.user.cart.getCartSlots.useQuery();

  const cartItems = cartData?.items || [];

  // Base total price without discounts for coupon eligibility check
  const baseTotalPrice = useMemo(
    () =>
      cartItems
        .filter((item) => !item.product?.isOutOfStock)
        .reduce(
          (sum, item) =>
            sum +
            (item.product?.price || 0) * (quantities[item.id] || item.quantity),
          0
        ),
    [cartItems, quantities]
  );

  const { data: couponsRaw } = trpc.user.coupon.getEligible.useQuery();

  const generateCouponDescription = (coupon: any): string => {
    let desc = "";

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
    return couponsRaw.data
      .map((coupon) => {
        let isEligible = true;
        let ineligibilityReason = "";
        if (
          coupon.maxLimitForUser &&
          coupon.usages.length >= coupon.maxLimitForUser
        ) {
          isEligible = false;
          ineligibilityReason = "Usage limit exceeded";
        }
        if (coupon.minOrder && parseFloat(coupon.minOrder) > baseTotalPrice) {
          isEligible = false;
          ineligibilityReason = `Min order ₹${coupon.minOrder}`;
        }
        return {
          id: coupon.id,
          code: coupon.couponCode,
          discountType: coupon.discountPercent ? "percentage" : "flat",
          discountValue: parseFloat(
            coupon.discountPercent || coupon.flatDiscount || "0"
          ),
          maxValue: coupon.maxValue ? parseFloat(coupon.maxValue) : undefined,
          minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
          description: generateCouponDescription(coupon),
          exclusiveApply: coupon.exclusiveApply,
          isEligible,
          ineligibilityReason: isEligible ? undefined : ineligibilityReason,
        };
      })
      .filter(
        (coupon) => coupon.ineligibilityReason !== "Usage limit exceeded"
      );
  }, [couponsRaw, baseTotalPrice]);

  const updateCartItem = trpc.user.cart.updateCartItem.useMutation();
  const removeFromCart = trpc.user.cart.removeFromCart.useMutation();

  useMarkDataFetchers(() => {
    refetch();
    refetchSlots();
  });
  useManualRefresh(() => {
    refetch();
    refetchSlots();
  });
  const [selectedSlots, setSelectedSlots] = useState<Record<number, number>>({});
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  // Process slots: flatten and unique
  const availableSlots = React.useMemo(() => {
    if (!slotsData) return [];
    const allSlots = Object.values(slotsData).flat();
    const uniqueSlots = allSlots.filter(
      (slot, index, self) => index === self.findIndex((s) => s.id === slot.id)
    );
    return uniqueSlots.map((slot) => ({
      label: `Delivery: ${dayjs(slot.deliveryTime).format(
        "ddd DD MMM, h:mm a"
      )} - Freeze by: ${dayjs(slot.freezeTime).format("h:mm a")}`,
      value: slot.id,
    }));
  }, [slotsData]);

  // Get available slots for a specific product
  const getAvailableSlotsForProduct = React.useMemo(() => {
    return (productId: number) => {
      if (!slotsData || !slotsData[productId]) return [];
      return slotsData[productId].map((slot) => ({
        label: `Delivery: ${dayjs(slot.deliveryTime).format(
          "ddd DD MMM, h:mm a"
        )} - Freeze by: ${dayjs(slot.freezeTime).format("h:mm a")}`,
        value: slot.id,
      }));
    };
  }, [slotsData]);

  // Calculate coupon discount
  const selectedCoupons = useMemo(
    () =>
      selectedCouponId ? eligibleCoupons?.filter((coupon) => coupon.id === selectedCouponId) : [],
    [eligibleCoupons, selectedCouponId]
  );

  const totalPrice = cartItems
    .filter((item) => !item.product?.isOutOfStock)
    .reduce((sum, item) => {
      const quantity = quantities[item.id] || item.quantity;
      return sum + (item.product?.price || 0) * quantity;
    }, 0);
  const dropdownData = useMemo(
    () =>
      eligibleCoupons?.map((coupon) => {
        const discount =
          coupon.discountType === "percentage"
            ? Math.min(
                (totalPrice * coupon.discountValue) / 100,
                coupon.maxValue || Infinity
              )
            : Math.min(coupon.discountValue, coupon.maxValue || totalPrice);
        const saveString = !isNaN(discount) ? ` (Save ₹${discount})` : "";
        const baseLabel = `${coupon.code} - ${coupon.description}${
          coupon.isEligible ? saveString : ""
        }`;
        const label = coupon.isEligible
          ? baseLabel
          : `${baseLabel} (${coupon.ineligibilityReason})`;
        return {
          label,
          value: coupon.id,
          disabled: !coupon.isEligible,
        };
      }) || [],
    [eligibleCoupons, totalPrice]
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

  useEffect(() => {
    const initial: Record<number, number> = {};
    cartItems.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    setQuantities(initial);
  }, [cartData]);

  // Auto-select delivery slots for each cart item
  useEffect(() => {
    if (slotsData && cartItems.length > 0) {
      const newSelectedSlots = { ...selectedSlots };

      cartItems.forEach(item => {
        // Skip if already has a selected slot
        if (selectedSlots[item.id]) return;

        const productSlots = slotsData[item.productId];
        if (!productSlots || productSlots.length === 0) return;

        // Filter slots for next 2 days
        const now = dayjs();
        const twoDaysFromNow = now.add(2, 'day').endOf('day');
        const upcomingSlots = productSlots.filter(slot =>
          dayjs(slot.deliveryTime).isBefore(twoDaysFromNow) &&
          dayjs(slot.deliveryTime).isAfter(now)
        );

        if (upcomingSlots.length > 0) {
          // Select the earliest available slot for this product
          const earliestSlot = upcomingSlots.sort((a, b) =>
            dayjs(a.deliveryTime).diff(dayjs(b.deliveryTime))
          )[0];
          newSelectedSlots[item.id] = earliestSlot.id;
        }
      });

      if (Object.keys(newSelectedSlots).length !== Object.keys(selectedSlots).length) {
        setSelectedSlots(newSelectedSlots);
      }
    }
  }, [slotsData, cartItems]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Failed to load your cart</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <AppContainer>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View style={tw`items-center justify-center py-12`}>
            <View
              style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}
            >
              <MaterialIcons name="shopping-cart" size={32} color="#9CA3AF" />
            </View>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              Your cart is empty
            </Text>
            <Text style={tw`text-gray-500 mt-2 text-center px-8`}>
              Looks like you haven&apos;t added anything to your cart yet.
            </Text>
              <TouchableOpacity
                style={tw`mt-6 bg-brand500 px-6 py-3 rounded-xl`}
                onPress={() => router.push("/(drawer)/(tabs)/home")}
              >
              <Text style={tw`text-white font-bold`}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>


              <View style={tw`bg-white rounded-2xl shadow-sm mb-4 border border-gray-100`}>
                {cartItems.map((item, index) => {
                  const productSlots = getAvailableSlotsForProduct(item.productId);
                  const selectedSlotForItem = selectedSlots[item.id];
                  const isAvailable = productSlots.length > 0 && !item.product?.isOutOfStock;
                  const quantity = quantities[item.id] || item.quantity;
                  const itemPrice = (item.product?.price || 0) * quantity;

                  return (
                    <View key={item.id}>
                     <View style={tw`p-4 ${!isAvailable ? "opacity-60" : ""}`}>
                        <View style={tw`flex-row items-center mb-2`}>
                          <Image
                            source={{ uri: item.product.images?.[0] }}
                            style={tw`w-8 h-8 rounded-lg bg-gray-100 mr-3`}
                          />

                          <Text
                            style={tw`text-sm text-gray-900 flex-1 mr-3`}
                            numberOfLines={2}
                          >
                            {item.product.name}
                          </Text>

                          <View style={tw`flex-row items-center w-24 justify-end`}>
                            <Quantifier
                              value={quantities[item.id] || item.quantity}
                              setValue={(value) => {
                                if (value === 0) {
                                  // Delete the item when quantity becomes 0
                                  removeFromCart.mutate(
                                    { itemId: item.id },
                                    {
                                      onSuccess: () => {
                                        refetch();
                                      },
                                      onError: (error: any) => {
                                        Alert.alert(
                                          "Error",
                                          error.message || "Failed to remove item"
                                        );
                                      },
                                    }
                                  );
                                } else {
                                  // Update quantity normally
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: value,
                                  }));
                                  updateCartItem.mutate({
                                    itemId: item.id,
                                    quantity: value,
                                  });
                                }
                              }}
                              step={1}
                            />

                            <Text style={tw`text-sm text-brand900 ml-2`}>
                              ₹{itemPrice}
                            </Text>
                          </View>
                        </View>

                       {/* Delivery Slot Selection per Product */}
                       <View style={tw`mt-1`}>
                         <BottomDropdown
                            label="Select Delivery Slot"
                           options={productSlots}
                           value={selectedSlotForItem || ""}
                           onValueChange={(value) => {
                             setSelectedSlots((prev) => ({
                               ...prev,
                               [item.id]: Number(value)
                             }));
                           }}
                           disabled={productSlots.length === 0}

                            triggerComponent={({ onPress, disabled, displayText }) => {
                              const selectedSlotForItem = selectedSlots[item.id];
                              const selectedSlot = productSlots.find(slot => slot.value === selectedSlotForItem);
                              const deliveryTimeText = selectedSlot
                                ? selectedSlot.label.split(' - ')[0].replace('Delivery: ', '')
                                : null;

                              return (
                                <View style={tw`flex-row items-center py-1`}>
                                 <MaterialIcons
                                   name="local-shipping"
                                   size={14}
                                   color="#6B7280"
                                   style={tw`mr-1`}
                                 />
                                 <Text style={tw`text-sm text-gray-900 mr-2`}>
                                   {deliveryTimeText || (productSlots.length === 0
                                     ? "No delivery slots available"
                                     : "Choose delivery slot")}
                                 </Text>
                                 <TouchableOpacity
                                   onPress={onPress}
                                   disabled={disabled}
                                   activeOpacity={0.7}
                                 >
                                   <Text style={tw`text-sm text-brand500 font-medium`}>
                                     Change
                                   </Text>
                                 </TouchableOpacity>
                               </View>
                             );
                           }}
                         />
                       </View>

                       {!isAvailable && (
                         <View
                           style={tw`bg-red-50 self-start px-2 py-1 rounded-md mt-2`}
                         >
                           <Text style={tw`text-xs font-bold text-red-600`}>
                             {item.product.isOutOfStock
                               ? "Out of Stock"
                               : "No delivery slots available"}
                           </Text>
                         </View>
                       )}
                     </View>

                     {/* Gray horizontal line between items (except for the last item) */}
                     {index < cartItems.length - 1 && (
                       <View style={tw`h-px bg-gray-200 mx-4`} />
                     )}
                   </View>
                 );
               })}
              </View>
            </>
          )}

         {/* Coupon Selection */}
         <View
           style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
         >
           <View style={tw`flex-row items-center mb-3`}>
             <View
               style={tw`w-8 h-8 bg-pink-50 rounded-full items-center justify-center mr-3`}
             >
               <MaterialIcons name="local-offer" size={18} color="#EC4899" />
             </View>
             <Text style={tw`text-base font-bold text-gray-900`}>
               Offers & Coupons
             </Text>
           </View>

            <BottomDropdown
              label="Available Coupons"
              options={dropdownData}
              value={selectedCouponId || ""}
              disabled={eligibleCoupons.length === 0}
              onValueChange={(value) => {
                setSelectedCouponId(value ? Number(value) : null);
              }}
              placeholder={
                eligibleCoupons.length === 0
                  ? "No coupons available"
                  : "Select a coupon"
              }
            />

           {eligibleCoupons.length === 0 && (
             <Text style={tw`text-gray-400 text-xs mt-2 ml-1`}>
               No coupons available for this order
             </Text>
           )}



            {selectedCouponId && (
              <TouchableOpacity
                style={tw`mt-3 self-end`}
                onPress={() => setSelectedCouponId(null)}
              >
                <Text style={tw`text-gray-400 text-xs font-medium`}>
                  Remove coupon
                </Text>
              </TouchableOpacity>
          )}
        </View>

        {/* Bottom Checkout Bar - Now Static */}
         {cartItems.length > 0 && (
           <View
             style={tw`bg-white border-t border-gray-100 p-4 mt-6 rounded-2xl shadow-sm`}
           >
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <View>
                  <Text style={tw`text-sm text-gray-500`}>
                    Total ({cartItems.filter(item => !item.product?.isOutOfStock).length} items)
                  </Text>
                  <Text style={tw`text-2xl font-bold text-gray-900`}>
                    ₹{finalTotal}
                  </Text>
                  {discountAmount > 0 && (
                    <Text style={tw`text-xs text-green-600`}>
                      Saved ₹{discountAmount} with {selectedCoupons.map(c => c.code).join(', ')}
                    </Text>
                  )}
                </View>
              </View>

             <View style={tw`flex-row gap-3`}>
                 <TouchableOpacity
                   style={tw`flex-1 bg-gray-100 py-3.5 rounded-xl items-center`}
                   onPress={() => router.push("/(drawer)/(tabs)/home")}
                 >
                 <Text style={tw`text-gray-900 font-bold`}>Shop More</Text>
               </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 bg-brand500 py-3.5 rounded-xl items-center shadow-md`}
                  onPress={() => {
                    const availableItems = cartItems
                      .filter(item => !item.product?.isOutOfStock && selectedSlots[item.id])
                      .map(item => item.id);

                    if (availableItems.length === 0) {
                      Alert.alert(
                        "No Items",
                        "Please select delivery slots for your items"
                      );
                      return;
                    }

                    // Group items by selected slot
                    const itemsBySlot: Record<number, number[]> = {};
                    availableItems.forEach(itemId => {
                      const slotId = selectedSlots[itemId];
                      if (!itemsBySlot[slotId]) {
                        itemsBySlot[slotId] = [];
                      }
                      itemsBySlot[slotId].push(itemId);
                    });

                    // Create checkout URL with slot groupings
                    const slotParams = Object.entries(itemsBySlot)
                      .map(([slotId, itemIds]) => `${slotId}:${itemIds.join(',')}`)
                      .join(';');

                    router.push(
                      `/(drawer)/(tabs)/cart/checkout?slots=${encodeURIComponent(slotParams)}${selectedCouponId ? `&coupons=${selectedCouponId}` : ''}` as any
                    );
                  }}
                >
                  <Text style={tw`text-white font-bold`}>Checkout</Text>
                </TouchableOpacity>
             </View>
           </View>
         )}
       </AppContainer>

      {/* Coupon Details Dialog */}
      <BottomDialog
        open={couponDialogOpen}
        onClose={() => setCouponDialogOpen(false)}
      >
        <View style={tw`p-6`}>
          <View style={tw`flex-row items-center mb-6`}>
            <View
              style={tw`w-10 h-10 bg-pink-50 rounded-full items-center justify-center mr-3`}
            >
              <MaterialIcons name="local-offer" size={20} color="#EC4899" />
            </View>
            <Text style={tw`text-xl font-bold text-gray-900`}>
              Applied Coupons
            </Text>
          </View>

          {selectedCoupons.map((coupon) => (
            <View
              key={coupon.id}
              style={tw`mb-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm`}
            >
              <View style={tw`flex-row justify-between items-start`}>
                <View>
                  <Text style={tw`font-bold text-gray-900 text-lg`}>
                    {coupon.code}
                  </Text>
                  <Text style={tw`text-sm text-gray-500 mt-1`}>
                    {coupon.description}
                  </Text>
                </View>
                <View style={tw`bg-green-50 px-2 py-1 rounded`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} OFF`}
                  </Text>
                </View>
              </View>
              {coupon.maxValue && (
                <Text style={tw`text-xs text-gray-400 mt-2`}>
                  Maximum discount up to ₹{coupon.maxValue}
                </Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={tw`mt-4 bg-gray-900 py-3.5 rounded-xl items-center`}
            onPress={() => setCouponDialogOpen(false)}
          >
            <Text style={tw`text-white font-bold`}>Close</Text>
          </TouchableOpacity>
        </View>
      </BottomDialog>
    </View>
  );
}
