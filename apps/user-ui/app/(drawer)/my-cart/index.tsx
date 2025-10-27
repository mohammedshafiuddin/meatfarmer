import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw, useManualRefresh } from 'common-ui';
import { BottomDropdown, Checkbox } from 'common-ui';
import { Quantifier } from 'common-ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useGetCartSlots } from '@/src/api-hooks/cart.api';
import dayjs from 'dayjs';
// import { useGetCart, useUpdateCartItem, useRemoveFromCart } from '../../src/api-hooks/cart.api';


export default function MyCart() {
  const [checkedProducts, setCheckedProducts] = useState<Record<number, boolean>>({});
  const { data: cartData, isLoading, error, refetch } = useGetCart();
  const { data: slotsData, refetch: refetchSlots } = useGetCartSlots();
  console.log({slotsData})
  
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

  useManualRefresh(() => { refetch(); refetchSlots(); });
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const cartItems = cartData?.items || [];
  const params = useLocalSearchParams();
  const router = useRouter();

  // Process slots: flatten and unique
  const availableSlots = React.useMemo(() => {
    if (!slotsData) return [];
    const allSlots = Object.values(slotsData).flat();
    const uniqueSlots = allSlots.filter((slot, index, self) =>
      index === self.findIndex(s => s.id === slot.id)
    );
    return uniqueSlots.map(slot => ({
      label: `Delivery: ${dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a')} - Freeze by: ${dayjs(slot.freezeTime).format('h:mm a')}`,
      value: slot.id,
    }));
  }, [slotsData]);

  // Calculate allowed product IDs for selected slot
  const allowedProductIds = React.useMemo(() => {
    if (!selectedSlot || !slotsData) return [];
    return Object.keys(slotsData).filter(productId =>
      slotsData[Number(productId)].some(slot => slot.id === selectedSlot)
    ).map(Number);
  }, [selectedSlot, slotsData]);

  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const initial: Record<number, number> = {};
    cartItems.forEach(item => {
      initial[item.id] = item.quantity;
    });
    setQuantities(initial);
  }, [cartData]);

  useEffect(() => {
    if (params.select && cartItems.length > 0) {
      const selectedItem = cartItems.find(item => item.productId === Number(params.select));
      if (selectedItem) {
        setCheckedProducts(prev => ({ ...prev, [selectedItem.id]: true }));
      }
    }
  }, [params.select, cartItems]);

  useEffect(() => {
    if (selectedSlot && slotsData && cartItems.length > 0) {
      const allowedProductIds = Object.keys(slotsData).filter(productId =>
        slotsData[Number(productId)].some(slot => slot.id === selectedSlot)
      ).map(Number);

      let hasUnselected = false;
      setCheckedProducts(prev => {
        const newChecked = { ...prev };
        Object.keys(newChecked).forEach(cartId => {
          const item = cartItems.find(i => i.id === Number(cartId));
          if (item && (!allowedProductIds.includes(item.productId) || item.product.isOutOfStock)) {
            delete newChecked[Number(cartId)];
            hasUnselected = true;
          }
        });
        return newChecked;
      });

      if (hasUnselected) {
        Alert.alert('Notice', 'Some items were unselected as they are not available in the selected time slot or are out of stock');
      }
    }
  }, [selectedSlot, slotsData, cartItems]);

  

  const totalPrice = cartItems.filter(item => checkedProducts[item.id] && !item.product.isOutOfStock).reduce((sum, item) => sum + item.product.price * (quantities[item.id] || item.quantity), 0);

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
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-semibold mb-2`}>Select Delivery Slot</Text>
          <BottomDropdown
            label="Delivery Slot"
            options={availableSlots}
            value={selectedSlot || ''}
            onValueChange={(value) => setSelectedSlot(Number(value))}
            placeholder={availableSlots.length === 0 ? "No delivery slots available" : "Choose a delivery slot"}
            disabled={availableSlots.length === 0}
          />
        </View>
        {cartItems.length === 0 ? (
          <Text style={tw`text-lg text-center`}>No items in your cart</Text>
        ) : (
          <>
            {!selectedSlot && (
              <Text style={tw`text-red-500 text-center mb-4`}>Please select a delivery slot to select items.</Text>
            )}
            {cartItems.map((item) => {
              const isAvailable = allowedProductIds.includes(item.productId) && !item.product.isOutOfStock;
           return (
           <View key={item.id} style={tw`mb-4 p-4 border-b border-gray-400 rounded ${!isAvailable ? 'opacity-50' : ''}`}>
              <View style={tw`flex-row items-center mb-2`}>
                 <Checkbox
                   checked={checkedProducts[item.id] || false}
                   onPress={() => {
                     if (!selectedSlot) {
                       Alert.alert('Error', 'Please select a delivery slot before selecting a product.');
                       return;
                     }
                     if (!isAvailable) {
                       const reason = item.product.isOutOfStock ? 'This item is out of stock.' : 'This item is not available in the selected delivery slot.';
                       Alert.alert('Error', reason);
                       return;
                     }
                     setCheckedProducts(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                   }}
                   style={tw`mr-4`}
                   disabled={!selectedSlot || !isAvailable}
                 />
               <Image source={{ uri: item.product.images?.[0] }} style={tw`w-16 h-16 rounded mr-4`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-semibold`}>{item.product.name}</Text>
                  {!isAvailable && (
                    <Text style={tw`text-sm text-red-500`}>
                      {item.product.isOutOfStock ? 'Out of stock' : 'Not available in selected slot'}
                    </Text>
                  )}
                  {isAvailable && (
                    <View style={tw`flex-row items-center mt-1`}>
                      <Text style={tw`text-sm mr-2`}>Quantity:</Text>
                      {checkedProducts[item.id] ? (
                        <Quantifier
                          value={quantities[item.id] || item.quantity}
                          setValue={(value) => {
                            setQuantities(prev => ({ ...prev, [item.id]: value }));
                            updateCartItem.mutate({ itemId: item.id, quantity: value }, {
                              onSuccess: () => {
                                // Optionally refetch or update local state
                              },
                              onError: (error: any) => {
                                Alert.alert('Error', error.message || 'Failed to update quantity');
                              },
                            });
                          }}
                          step={1} // Assuming step 1 for now, can be from product if available
                        />
                      ) : (
                        <Text style={tw`text-sm`}>{item.quantity} {item.product.unit}</Text>
                      )}
                    </View>
                  )}
                 <Text style={tw`text-base font-bold`}>₹{item.product.price * (quantities[item.id] || item.quantity)}</Text>
               </View>
               <TouchableOpacity
                 onPress={() => {
                   removeFromCart.mutate(item.id, {
                     onSuccess: () => {
                       Alert.alert('Success', 'Item removed from cart');
                       refetch();
                     },
                     onError: (error: any) => {
                       Alert.alert('Error', error.message || 'Failed to remove item');
                     },
                   });
                 }}
                 style={tw`ml-2`}
               >
                 <MaterialIcons name="delete" size={20} color="#ef4444" />
               </TouchableOpacity>
            </View>
          </View>
          )
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
            style={tw`bg-pink1 p-3 rounded-md flex-1 mr-2 items-center`}
            onPress={() => {
              const selectedItems = Object.keys(checkedProducts).filter(id => checkedProducts[Number(id)]);
              if (selectedItems.length === 0) {
                Alert.alert('Error', 'Please select items to checkout');
                return;
              }
              if (!selectedSlot) {
                Alert.alert('Error', 'Please select a delivery slot');
                return;
              }
              router.push(`/checkout?selected=${selectedItems.join(',')}&slot=${selectedSlot}` as any);
            }}
          >
            <Text style={tw`text-white text-base font-bold`}>Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`bg-pink2 p-3 rounded-md flex-1 ml-2 items-center`}>
            <Text style={tw` text-base font-bold`}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}