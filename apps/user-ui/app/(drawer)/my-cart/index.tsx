import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { tw } from 'common-ui';
import { CustomDropdown, Checkbox } from 'common-ui';
import { Quantifier } from 'common-ui';
import { useGetCart, useUpdateCartItem, useRemoveFromCart } from '@/src/api-hooks/cart.api';
// import { useGetCart, useUpdateCartItem, useRemoveFromCart } from '../../src/api-hooks/cart.api';



// TODO: Implement delivery slot selection based on product availability

export default function MyCart() {
  const [checkedProducts, setCheckedProducts] = useState<Record<number, boolean>>({});
  const { data: cartData, isLoading, error, refetch } = useGetCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

  const cartItems = cartData?.items || [];

  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const initial: Record<number, number> = {};
    cartItems.forEach(item => {
      initial[item.id] = item.quantity;
    });
    setQuantities(initial);
  }, [cartItems]);

  const totalPrice = cartItems.filter(item => checkedProducts[item.id]).reduce((sum, item) => sum + item.product.price * (quantities[item.id] || item.quantity), 0);

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
        <Text style={tw`text-2xl font-bold mb-4`}>My Cart</Text>

        {cartItems.map((item) => (
          <View key={item.id} style={tw`mb-4 p-4 bg-gray-100 rounded`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Checkbox
                checked={checkedProducts[item.id] || false}
                onPress={() => setCheckedProducts(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                style={tw`mr-4`}
              />
              <Image source={{ uri: item.product.images?.[0] }} style={tw`w-16 h-16 rounded mr-4`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-semibold`}>{item.product.name}</Text>
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
                <Text style={tw`text-red-500 text-sm`}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={tw`mt-4 p-4 bg-gray-200 rounded`}>
          <Text style={tw`text-xl font-bold`}>Total: ₹{totalPrice}</Text>
        </View>

        <View style={tw`flex-row justify-between mt-4`}>
          <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 mr-2 items-center`}>
            <Text style={tw`text-white text-base font-bold`}>Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`bg-gray-600 p-3 rounded-md flex-1 ml-2 items-center`}>
            <Text style={tw`text-white text-base font-bold`}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}