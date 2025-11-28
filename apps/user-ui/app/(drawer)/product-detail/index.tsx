import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ImageCarousel, tw, BottomDialog, useManualRefresh, useMarkDataFetchers, LoadingDialog } from 'common-ui';
import { theme } from 'common-ui/src/theme';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import CustomHeader from '@/components/CustomHeader';
import { trpc } from '@/src/trpc-client';

const { width: screenWidth } = Dimensions.get("window");
const carouselWidth = screenWidth;
const carouselHeight = carouselWidth * 0.8;

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const { data: productDetail, isLoading, error, refetch } = trpc.user.product.getProductDetails.useQuery({ id: id.toString() });
  const addToCart = trpc.user.cart.addToCart.useMutation();
  const { data: productCouponsRaw } = trpc.user.coupon.getProductCoupons.useQuery({ productId: Number(id) });
  
  useManualRefresh(() => {
    refetch();
  });

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleAddToCart = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        Alert.alert('Success', 'Item added to cart!');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

  const handleBuyNow = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        router.push(`/my-cart?select=${productId}`);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !productDetail) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Product not found or error loading</Text>
      </View>
    );
  }

  const discountPercentage = productDetail.marketPrice
    ? Math.round(((Number(productDetail.marketPrice) - Number(productDetail.price)) / Number(productDetail.marketPrice)) * 100)
    : 0;

  

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

  const productCoupons = useMemo(() => {
    if (!productCouponsRaw?.data) return [];
    return productCouponsRaw.data.map(coupon => {
      const discount = coupon.discountPercent
        ? Math.min((Number(productDetail.price) * parseFloat(coupon.discountPercent.toString())) / 100, coupon.maxValue ? parseFloat(coupon.maxValue.toString()) : Infinity)
        : Math.min(parseFloat(coupon.flatDiscount?.toString() || '0'), coupon.maxValue ? parseFloat(coupon.maxValue.toString()) : Number(productDetail.price));
      return {
        id: coupon.id,
        code: coupon.couponCode,
        description: generateCouponDescription(coupon),
        potentialSavings: Math.round(discount),
      };
    });
  }, [productCouponsRaw, productDetail]);

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />
      {/* <CustomHeader /> */}

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-32`}>
        {/* Image Carousel */}
        <View style={tw`bg-white shadow-sm mb-4`}>
          <ImageCarousel
            urls={productDetail.images}
            imageWidth={carouselWidth}
            imageHeight={carouselHeight}
            showPaginationDots={true}
          />
        </View>

        {/* Product Info */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row justify-between items-start mb-2`}>
              <Text style={tw`text-2xl font-bold text-gray-900 flex-1 mr-2`}>{productDetail.name}</Text>
              {productDetail.isOutOfStock && (
                <View style={tw`bg-red-100 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-red-700 text-xs font-bold`}>Out of Stock</Text>
                </View>
              )}
            </View>

            <Text style={tw`text-base text-gray-500 mb-4 leading-6`}>{productDetail.shortDescription}</Text>

            <View style={tw`flex-row items-end`}>
              <Text style={tw`text-3xl font-bold text-gray-900`}>₹{productDetail.price}</Text>
              <Text style={tw`text-gray-500 text-lg mb-1 ml-1`}>/ {productDetail.unit}</Text>
              {productDetail.marketPrice && (
                <View style={tw`ml-3 mb-1 flex-row items-center`}>
                  <Text style={tw`text-gray-400 text-base line-through mr-2`}>₹{productDetail.marketPrice}</Text>
                  <View style={tw`bg-green-100 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-green-700 text-xs font-bold`}>{discountPercentage}% OFF</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Delivery Slots */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3`}>
                <MaterialIcons name="schedule" size={18} color="#3B82F6" />
              </View>
              <Text style={tw`text-lg font-bold text-gray-900`}>Available Slots</Text>
            </View>

            {productDetail.deliverySlots.length === 0 ? (
              <Text style={tw`text-gray-400 italic`}>No delivery slots available currently</Text>
            ) : (
              <>
                {productDetail.deliverySlots.slice(0, 2).map((slot, index) => (
                  <View key={index} style={tw`flex-row items-start mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100`}>
                    <MaterialIcons name="local-shipping" size={20} color="#3B82F6" style={tw`mt-0.5`} />
                    <View style={tw`ml-3 flex-1`}>
                      <Text style={tw`text-gray-900 font-bold text-sm`}>
                        {dayjs(slot.deliveryTime).format('ddd, DD MMM • h:mm A')}
                      </Text>
                      <Text style={tw`text-xs text-gray-500 mt-1`}>
                        Freeze by: {dayjs(slot.freezeTime).format('h:mm A')}
                      </Text>
                    </View>
                  </View>
                ))}
                {productDetail.deliverySlots.length > 2 && (
                  <TouchableOpacity
                    onPress={() => setShowAllSlots(true)}
                    style={tw`items-center py-2`}
                  >
                    <Text style={tw`text-pink1 font-bold text-sm`}>View All {productDetail.deliverySlots.length} Slots</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Coupons */}
        {productCoupons && productCoupons.length > 0 && (
          <View style={tw`px-4 mb-4`}>
            <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`w-8 h-8 bg-pink-50 rounded-full items-center justify-center mr-3`}>
                  <MaterialIcons name="local-offer" size={18} color="#EC4899" />
                </View>
                <Text style={tw`text-lg font-bold text-gray-900`}>Offers for you</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
                {productCoupons.map((coupon) => (
                  <View key={coupon.id} style={tw`bg-pink-50 p-3 rounded-xl border border-pink-100 mr-3 w-64`}>
                    <View style={tw`flex-row justify-between items-start mb-1`}>
                      <Text style={tw`font-bold text-gray-900`}>{coupon.code}</Text>
                      <Text style={tw`text-pink1 font-bold text-xs`}>Save ₹{coupon.potentialSavings}</Text>
                    </View>
                    <Text style={tw`text-xs text-gray-600 leading-4`}>{coupon.description}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-3`}>About the Product</Text>
            {!productDetail.longDescription ? (
              <Text style={tw`text-gray-400 italic`}>
                No detailed description available.
              </Text>
            ) : (
              <Text style={tw`text-gray-600 leading-6`}>{productDetail.longDescription}</Text>
            )}

            {productDetail.store && (
              <View style={tw`mt-6 pt-4 border-t border-gray-100 flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3`}>
                  <FontAwesome5 name="store" size={16} color="#4B5563" />
                </View>
                <View>
                  <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>Sourced From</Text>
                  <Text style={tw`text-gray-900 font-bold`}>{productDetail.store.name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Package Deals */}
        {productDetail.specialPackageDeals && productDetail.specialPackageDeals.length > 0 && (
          <View style={tw`px-4 mb-4`}>
            <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`w-8 h-8 bg-amber-50 rounded-full items-center justify-center mr-3`}>
                  <MaterialIcons name="stars" size={18} color="#F59E0B" />
                </View>
                <Text style={tw`text-lg font-bold text-gray-900`}>Bulk Savings</Text>
              </View>

              {productDetail.specialPackageDeals.map((deal, index) => (
                <View key={index} style={tw`flex-row justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100 mb-2`}>
                  <Text style={tw`text-amber-900 font-medium`}>Buy {deal.quantity} {productDetail.unit}</Text>
                  <Text style={tw`text-amber-900 font-bold text-lg`}>₹{deal.price}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-${Platform.OS === 'ios' ? '8' : '4'} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-row gap-3`}>
        <TouchableOpacity
          style={[tw`flex-1 py-3.5 rounded-xl items-center border`, {
            borderColor: productDetail.isOutOfStock ? '#9ca3af' : theme.colors.pink1,
            backgroundColor: 'white'
          }]}
          onPress={() => !productDetail.isOutOfStock && handleAddToCart(productDetail.id)}
          disabled={productDetail.isOutOfStock}
        >
          <Text style={[tw`font-bold text-base`, { color: productDetail.isOutOfStock ? '#9ca3af' : theme.colors.pink1 }]}>
            {productDetail.isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[tw`flex-1 py-3.5 rounded-xl items-center shadow-md`, {
            backgroundColor: (productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) ? '#9ca3af' : theme.colors.pink1
          }]}
          onPress={() => !(productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) && handleBuyNow(productDetail.id)}
          disabled={productDetail.isOutOfStock || productDetail.deliverySlots.length === 0}
        >
          <Text style={tw`text-white text-base font-bold`}>
            {productDetail.isOutOfStock ? 'Out of Stock' :
              productDetail.deliverySlots.length === 0 ? 'No Slots' :
                'Buy Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* All Slots Dialog */}
      <BottomDialog open={showAllSlots} onClose={() => setShowAllSlots(false)}>
        <View style={tw`p-6 max-h-[500px]`}>
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
            </View>
            <Text style={tw`text-xl font-bold text-gray-900`}>All Delivery Slots</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {productDetail.deliverySlots.map((slot, index) => (
              <View key={index} style={tw`flex-row items-start mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100`}>
                <MaterialIcons name="local-shipping" size={20} color="#3B82F6" style={tw`mt-0.5`} />
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-gray-900 font-bold text-base`}>
                    {dayjs(slot.deliveryTime).format('ddd, DD MMM • h:mm A')}
                  </Text>
                  <Text style={tw`text-sm text-gray-500 mt-1`}>
                    Freeze by: {dayjs(slot.freezeTime).format('h:mm A')}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={tw`mt-4 bg-gray-900 py-3.5 rounded-xl items-center`}
            onPress={() => setShowAllSlots(false)}
          >
            <Text style={tw`text-white font-bold`}>Close</Text>
          </TouchableOpacity>
        </View>
      </BottomDialog>

      <LoadingDialog open={isLoadingDialogOpen} message="Processing..." />
    </View>
  );
}