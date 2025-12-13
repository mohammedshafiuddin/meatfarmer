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
import { BottomDropdown, Checkbox, BottomDialog } from "common-ui";
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
        .filter(
          (item) => checkedProducts[item.id] && !item.product?.isOutOfStock
        )
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

  const totalPrice = cartItems
    .filter((item) => checkedProducts[item.id] && !item.product?.isOutOfStock)
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
        {/* Delivery Slot Selection */}
        <View
          style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
        >
          <View style={tw`flex-row items-center mb-3`}>
            <View
              style={tw`w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3`}
            >
              <MaterialIcons name="schedule" size={18} color="#3B82F6" />
            </View>
            <Text style={tw`text-base font-bold text-gray-900`}>
              Delivery Slot
            </Text>
          </View>
          <BottomDropdown
            label="Select Slot"
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
            <Text style={tw`text-gray-400 text-xs mt-2 ml-1`}>
              No coupons available for this order
            </Text>
          )}

          {!selectedSlot && (
            <Text style={tw`text-amber-600 text-xs mt-2 ml-1`}>
              Select a delivery slot to view coupons
            </Text>
          )}



          {selectedCoupons.length > 0 && (
            <TouchableOpacity
              style={tw`mt-3 self-end`}
              onPress={() => setSelectedCouponId([])}
            >
              <Text style={tw`text-gray-400 text-xs font-medium`}>
                Remove all coupons
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
              Looks like you haven't added anything to your cart yet.
            </Text>
              <TouchableOpacity
                style={tw`mt-6 bg-pink1 px-6 py-3 rounded-xl`}
                onPress={() => router.push("/(drawer)/(tabs)/home")}
              >
              <Text style={tw`text-white font-bold`}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={tw`flex-row items-center justify-between mb-4 px-1`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                Items ({cartItems.length})
              </Text>
              {!selectedSlot && (
                <Text style={tw`text-red-500 text-xs font-medium`}>
                  Select slot to enable items
                </Text>
              )}
            </View>

             {cartItems.map((item) => {
               const isAvailable =
                 allowedProductIds.includes(item.productId) &&
                 !item.product.isOutOfStock;
               const quantity = quantities[item.id] || item.quantity;
               const itemPrice = (item.product?.price || 0) * quantity;

               return (
                 <View
                   key={item.id}
                   style={tw`bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100 ${
                     !isAvailable ? "opacity-60" : ""
                   }`}
                 >
                  <View style={tw`flex-row items-start`}>
                    <View style={tw`mt-1 mr-3`}>
                      <Checkbox
                        checked={checkedProducts[item.id] || false}
                        onPress={() => {
                          if (!selectedSlot) {
                            Alert.alert(
                              "Error",
                              "Please select a delivery slot first."
                            );
                            return;
                          }
                          if (!isAvailable) {
                            const reason = item.product.isOutOfStock
                              ? "This item is out of stock."
                              : "This item is not available in the selected delivery slot.";
                            Alert.alert("Unavailable", reason);
                            return;
                          }
                          setCheckedProducts((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        }}
                        disabled={!selectedSlot || !isAvailable}
                      />
                    </View>

                    <Image
                      source={{ uri: item.product.images?.[0] }}
                      style={tw`w-20 h-20 rounded-xl bg-gray-100 mr-4`}
                    />

                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row justify-between items-start`}>
                        <Text
                          style={tw`text-base font-bold text-gray-900 flex-1 mr-2`}
                          numberOfLines={2}
                        >
                          {item.product.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
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
                          }}
                          style={tw`p-1 bg-red-50 rounded-lg`}
                        >
                          <MaterialIcons
                            name="delete-outline"
                            size={18}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>

                      {!isAvailable && (
                        <View
                          style={tw`bg-red-50 self-start px-2 py-1 rounded-md mt-1 mb-1`}
                        >
                          <Text style={tw`text-xs font-bold text-red-600`}>
                            {item.product.isOutOfStock
                              ? "Out of Stock"
                              : "Unavailable in Slot"}
                          </Text>
                        </View>
                      )}

                       <View
                         style={tw`flex-row items-center justify-between mt-3`}
                       >
                         <View style={tw`flex-row items-baseline`}>
                           <Text style={tw`text-lg font-bold text-gray-900`}>
                             ₹{itemPrice}
                           </Text>
                         </View>

                        <View style={tw`${!isAvailable ? "opacity-50" : ""}`}>
                          <Quantifier
                            value={quantities[item.id] || item.quantity}
                            setValue={(value) => {
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: value,
                              }));
                              updateCartItem.mutate({
                                itemId: item.id,
                                quantity: value,
                              });
                            }}
                            step={1}
                          />
                        </View>
                      </View>


                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View style={tw`h-36`}></View>
      </AppContainer>

      {/* Bottom Checkout Bar */}
      {cartItems.length > 0 && (
        <View
          style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-${
            Platform.OS === "ios" ? "8" : "4"
          } shadow-lg`}
        >
           <View style={tw`flex-row justify-between items-center mb-4`}>
             <View>
               <Text style={tw`text-sm text-gray-500`}>
                 Total ({Object.values(checkedProducts).filter(Boolean).length}{" "}
                 items)
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
              style={tw`flex-1 bg-pink1 py-3.5 rounded-xl items-center shadow-md`}
              onPress={() => {
                const selectedItems = Object.keys(checkedProducts).filter(
                  (id) => checkedProducts[Number(id)]
                );
                if (selectedItems.length === 0) {
                  Alert.alert(
                    "Select Items",
                    "Please select at least one item to checkout"
                  );
                  return;
                }
                if (!selectedSlot) {
                  Alert.alert(
                    "Select Slot",
                    "Please select a delivery slot to proceed"
                  );
                  return;
                }
                router.push(
                  `/(drawer)/(tabs)/cart/checkout?selected=${selectedItems.join(
                    ","
                  )}&slot=${selectedSlot}&coupons=${selectedCouponId.join(
                    ","
                  )}` as any
                );
              }}
            >
              <Text style={tw`text-white font-bold`}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
