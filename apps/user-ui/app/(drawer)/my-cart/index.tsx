import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  tw,
  useManualRefresh,
  AppContainer,
  useMarkDataFetchers,
} from "common-ui";
import { BottomDropdown, Checkbox, BottomDialog } from "common-ui";
import { Quantifier } from "common-ui";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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

interface ItemDiscountInfo {
  discountedPrice: number;
  discountAmount: number;
  couponCount: number;
}

export default function MyCart() {
  const [checkedProducts, setCheckedProducts] = useState<
    Record<number, boolean>
  >({});
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
         .filter((item) => checkedProducts[item.id] && !item.product?.isOutOfStock)
         .reduce(
           (sum, item) =>
             sum +
             (item.product?.price || 0) * (quantities[item.id] || item.quantity),
           0
         ),
     [cartItems, checkedProducts, quantities]
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
       if (coupon.minOrder && parseFloat(coupon.minOrder) > baseTotalPrice) {
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
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<number[]>([]);
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

  // Calculate allowed product IDs for selected slot
  const allowedProductIds = React.useMemo(() => {
    if (!selectedSlot || !slotsData) return [];
    return Object.keys(slotsData)
      .filter((productId) =>
        slotsData[Number(productId)].some((slot) => slot.id === selectedSlot)
      )
      .map(Number);
  }, [selectedSlot, slotsData]);
  
    // Calculate coupon discount
  const selectedCoupons = useMemo(
    () =>
      eligibleCoupons?.filter((coupon) => selectedCouponId.includes(coupon.id)),
    [eligibleCoupons, selectedCouponId]
  );
    // Calculate discounted price for each item
  const getItemDiscountInfo = (item: CartItem, ): ItemDiscountInfo => {
    const quantity = quantities[item.id] || item.quantity;
    const originalPrice = (item.product?.price || 0) * quantity;
    let discount = 0;
    console.log({selectedCoupons})
    
    const applicableCoupons = selectedCoupons.filter((coupon) => {
      // For cart, assume all coupons apply to all items, or check applicableProducts if available
      return true; // Simplify for cart preview
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
  const totalPrice = cartItems
    .filter((item) => checkedProducts[item.id] && !item.product?.isOutOfStock)
    .reduce((sum, item) => {
      try {

        const discountInfo = getItemDiscountInfo(item);
        const newSum = sum + discountInfo.discountedPrice;
        
        return newSum;
      }
      catch (error) {
        console.log({error})
        
        return sum;
      }
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

  useEffect(() => {
    const initial: Record<number, number> = {};
    cartItems.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    setQuantities(initial);
  }, [cartData]);

  useEffect(() => {
    if (params.select && cartItems.length > 0) {
      const selectedItem = cartItems.find(
        (item) => item.productId === Number(params.select)
      );
      if (selectedItem) {
        setCheckedProducts((prev) => ({ ...prev, [selectedItem.id]: true }));
      }
    }
  }, [params.select, cartItems]);

  useEffect(() => {
    if (selectedSlot && slotsData && cartItems.length > 0) {
      const allowedProductIds = Object.keys(slotsData)
        .filter((productId) =>
          slotsData[Number(productId)].some((slot) => slot.id === selectedSlot)
        )
        .map(Number);

      let hasUnselected = false;
      setCheckedProducts((prev) => {
        const newChecked = { ...prev };
        Object.keys(newChecked).forEach((cartId) => {
          const item = cartItems.find((i) => i.id === Number(cartId));
          if (
            item &&
            (!allowedProductIds.includes(item.productId) ||
              item.product.isOutOfStock)
          ) {
            delete newChecked[Number(cartId)];
            hasUnselected = true;
          }
        });
        return newChecked;
      });

      if (hasUnselected) {
        Alert.alert(
          "Notice",
          "Some items were unselected as they are not available in the selected time slot or are out of stock"
        );
      }
    }
  }, [selectedSlot, slotsData, cartItems]);


  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Loading cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Error loading cart</Text>
      </View>
    );
  }

  return (
    <AppContainer>
      <View style={tw`mb-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Select Delivery Slot</Text>
        <BottomDropdown
          label="Delivery Slot"
          options={availableSlots}
          value={selectedSlot || ""}
          onValueChange={(value) => setSelectedSlot(Number(value))}
          placeholder={
            availableSlots.length === 0
              ? "No delivery slots available"
              : "Choose a delivery slot"
          }
          disabled={availableSlots.length === 0}
        />
      </View>

      {/* Coupon Selection */}
      <View style={tw`mb-4 bg-white rounded-lg p-4 shadow-md`}>
        <Text style={tw`text-lg font-semibold mb-3`}>Apply Coupon</Text>
        <BottomDropdown
          label="Available Coupons"
          options={dropdownData}
          value={selectedCouponId}
          multiple={true}
          disabled={!selectedSlot || eligibleCoupons.length === 0}
          onValueChange={(value) => {
            const newSelected = value as number[];
            const selectedCoupons = eligibleCoupons.filter((c) =>
              newSelected.includes(c.id)
            );
            const exclusiveCoupons = selectedCoupons.filter(
              (c) => c.exclusiveApply
            );

            if (exclusiveCoupons.length > 0 && newSelected.length > 1) {
              // Keep only the exclusive coupon(s)
              const exclusiveIds = exclusiveCoupons.map((c) => c.id);
              setSelectedCouponId(exclusiveIds);
              Alert.alert(
                "Exclusive Coupon",
                "Exclusive coupons cannot be combined with others. Other coupons have been removed."
              );
            } else {
              setSelectedCouponId(newSelected);
            }
          }}
          placeholder={
            eligibleCoupons.length === 0
              ? "No coupons available"
              : selectedSlot
              ? "Select coupons"
              : "Select delivery slot first"
          }
        />

        {eligibleCoupons.length === 0 && (
          <Text style={tw`text-gray-500 text-sm mt-2`}>
            No coupons available for this order
          </Text>
        )}

        {!selectedSlot && (
          <Text style={tw`text-red-500 text-sm mt-2`}>
            Select a delivery slot to apply coupons
          </Text>
        )}

        {selectedCoupons &&
          selectedCoupons.length > 0 &&
          discountAmount > 0 && (
            <View
              style={tw`mt-3 p-3 bg-pink-50 border border-pink-200 rounded`}
            >
              <Text style={tw`text-pink1 text-sm font-medium`}>
                🎉 You save ₹{discountAmount} with{" "}
                {selectedCoupons.map((c) => c.code).join(", ")}
              </Text>
            </View>
          )}

        {selectedCoupons.length > 0 && (
          <TouchableOpacity
            style={tw`mt-3`}
            onPress={() => setSelectedCouponId([])}
          >
            <Text style={tw`text-gray-500 text-sm underline`}>
              Remove all coupons
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {cartItems.length === 0 ? (
        <Text style={tw`text-lg text-center`}>No items in your cart</Text>
      ) : (
        <>
          {!selectedSlot && (
            <Text style={tw`text-red-500 text-center mb-4`}>
              Please select a delivery slot to select items.
            </Text>
          )}
          {cartItems.map((item) => {
            const isAvailable =
              allowedProductIds.includes(item.productId) &&
              !item.product.isOutOfStock;
            return (
              <View
                key={item.id}
                style={tw`mb-4 p-4 border-b border-gray-400 rounded`}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <Checkbox
                    checked={checkedProducts[item.id] || false}
                    onPress={() => {
                      if (!selectedSlot) {
                        Alert.alert(
                          "Error",
                          "Please select a delivery slot before selecting a product."
                        );
                        return;
                      }
                      if (!isAvailable) {
                        const reason = item.product.isOutOfStock
                          ? "This item is out of stock."
                          : "This item is not available in the selected delivery slot.";
                        Alert.alert("Error", reason);
                        return;
                      }
                      
                      setCheckedProducts((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }));
                    }}
                    style={tw`mr-4 ${!isAvailable ? "opacity-50" : ""}`}
                    disabled={!selectedSlot || !isAvailable}
                  />
                  <Image
                    source={{ uri: item.product.images?.[0] }}
                    style={tw`w-16 h-16 rounded mr-4 ${
                      !isAvailable ? "opacity-50" : ""
                    }`}
                  />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-lg font-semibold`}>
                      {item.product.name}
                    </Text>
                    {!isAvailable && (
                      <Text style={tw`text-sm text-red-500`}>
                        {item.product.isOutOfStock
                          ? "Out of stock"
                          : "Not available in selected slot"}
                      </Text>
                    )}
                    <View style={tw`flex-row items-center mt-1`}>
                      <View style={[tw``, !isAvailable && { opacity: 1 }]}>
                        {/* <Text style={tw`text-sm mr-2`}>Quantity:</Text> */}
                        <Quantifier
                          value={quantities[item.id] || item.quantity}
                          setValue={(value) => {
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: value,
                            }));
                            updateCartItem.mutate(
                              { itemId: item.id, quantity: value },
                              {
                                onSuccess: () => {
                                  // Optionally refetch or update local state
                                },
                                onError: (error: any) => {
                                  Alert.alert(
                                    "Error",
                                    error.message || "Failed to update quantity"
                                  );
                                },
                              }
                            );
                          }}
                          step={1} // Assuming step 1 for now, can be from product if available
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          removeFromCart.mutate(
                            { itemId: item.id },
                            {
                              onSuccess: () => {
                                Alert.alert(
                                  "Success",
                                  "Item removed from cart"
                                );
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
                        }}
                        style={[tw`ml-2`, !isAvailable && { opacity: 1 }]}
                      >
                        <MaterialIcons
                          name="delete"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={tw`flex-row items-center ${
                        !isAvailable ? "opacity-50" : ""
                      }`}
                    >
                      <Text style={tw`text-base mr-2`}>Amount:</Text>
                      <View style={tw`flex-row items-center`}>
                        <Text
                          style={tw`text-base line-through text-gray-500 mr-2`}
                        >
                          ₹
                          {(item.product?.price || 0) *
                            (quantities[item.id] || item.quantity)}
                        </Text>
                        <Text style={tw`text-base font-bold text-pink1`}>
                          ₹{getItemDiscountInfo(item).discountedPrice}
                        </Text>
                      </View>
                    </View>
                    {getItemDiscountInfo(item).couponCount > 0 && (
                      <View style={tw`mt-1`}>
                        <TouchableOpacity
                          onPress={() => setCouponDialogOpen(true)}
                        >
                          <Text style={tw`text-xs text-pink1 underline`}>
                            {getItemDiscountInfo(item).couponCount} coupon
                            {getItemDiscountInfo(item).couponCount > 1
                              ? "s"
                              : ""}{" "}
                            applied, saved ₹
                            {getItemDiscountInfo(item).discountAmount}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          <View style={tw`mt-4 p-4 bg-pink2 rounded`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-xl font-bold`}>Total: ₹{totalPrice}</Text>
              <Text style={tw`text-sm text-gray-600`}>
                {Object.values(checkedProducts).filter(Boolean).length} items
              </Text>
            </View>
          </View>

          <View style={tw`flex-row justify-between mt-4`}>
            <TouchableOpacity
              style={tw`bg-pink1 p-2 rounded-md flex-1 mr-2 items-center`}
              onPress={() => {
                const selectedItems = Object.keys(checkedProducts).filter(
                  (id) => checkedProducts[Number(id)]
                );
                if (selectedItems.length === 0) {
                  Alert.alert("Error", "Please select items to checkout");
                  return;
                }
                if (!selectedSlot) {
                  Alert.alert("Error", "Please select a delivery slot");
                  return;
                }
                router.push(
                  `/checkout?selected=${selectedItems.join(
                    ","
                  )}&slot=${selectedSlot}&coupons=${selectedCouponId.join(
                    ","
                  )}` as any
                );
              }}
            >
              <Text style={tw`text-white text-base font-bold`}>Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-pink2 p-2 rounded-md flex-1 ml-2 items-center`}
              onPress={() => router.push("/(drawer)/dashboard")}
            >
              <Text style={tw` text-base font-bold`}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <BottomDialog
        open={couponDialogOpen}
        onClose={() => setCouponDialogOpen(false)}
      >
        <View style={tw`p-6`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-6`}>
            Applied Coupons
          </Text>
          {selectedCoupons.map((coupon) => (
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
    </AppContainer>
  );
}
