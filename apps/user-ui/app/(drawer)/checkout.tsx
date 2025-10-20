import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tw } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { Checkbox } from 'common-ui';
import { useGetCart } from '@/src/api-hooks/cart.api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'common-ui/src/services/axios';
import dayjs from 'dayjs';
import AddressForm from '@/src/components/AddressForm';
import { useGetSlots } from '@/src/api-hooks/slot.api';

interface Address {
  id: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const fetchAddresses = async (): Promise<Address[]> => {
  const response = await axios.get('/uv/address');
  return response.data.data;
};

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { data: cartData } = useGetCart();
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
  const { data: slotsData } = useGetSlots();

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const isAddressSelected = !!selectedAddress;

  const cartItems = cartData?.items || [];
  const selectedIds = params.selected ? (params.selected as string).split(',').map(Number) : [];
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));

  useEffect(() => {
    if (params.slot) {
      setSlotId(Number(params.slot));
    }
  }, [params.slot]);

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const placeOrderMutation = useMutation({
    mutationFn: async (paymentMethod: 'cod' | 'online') => {
      const orderData = {
        selectedItems: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        addressId: selectedAddress,
        slotId,
        paymentMethod,
      };
      const response = await axios.post('/uv/orders', orderData);
      return response.data;
    },
    onSuccess: (data) => {
      router.replace(`/order-success?orderId=${data.data.id}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to place order');
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
    placeOrderMutation.mutate('cod');
  };

  const handleOrderOnline = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }
    // For now, just mutate, later integrate payment
    placeOrderMutation.mutate('online');
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold mb-4`}>Checkout</Text>

        {/* Order Summary */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold mb-2`}>Order Summary</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={tw`flex-row justify-between py-2 border-b border-gray-200`}>
              <Text style={tw`flex-1`}>{item.product.name} (x{item.quantity})</Text>
              <Text style={tw`font-semibold`}>₹{item.subtotal}</Text>
            </View>
          ))}
          <View style={tw`flex-row justify-between mt-2`}>
            <Text style={tw`text-lg font-bold`}>Total</Text>
            <Text style={tw`text-lg font-bold`}>₹{totalAmount}</Text>
          </View>
           {slotId && (
             <Text style={tw`text-sm text-gray-600 mt-2`}>
               Delivery Slot: {slotsData?.slots?.find(slot => slot.id === slotId)?.deliveryTime
                 ? dayjs(slotsData.slots.find(slot => slot.id === slotId).deliveryTime).format('ddd DD MMM, h:mm a')
                 : 'Loading slot details...'}
             </Text>
           )}
        </View>

        {/* Address Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold mb-2`}>Select Address</Text>
          {(!addresses || addresses.length === 0) ? (
            <Text style={tw`text-center text-gray-500 mb-2`}>No addresses found</Text>
          ) : (
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={true}>
              {addresses.map((address) => {
                const addressText = `${address.name}, ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${address.city}, ${address.state} - ${address.pincode}, ${address.phone}${address.isDefault ? ' (Default)' : ''}`;
                return (
                  <View
                    key={address.id}
                    style={tw`p-4 mx-2 border rounded mb-2 flex-row items-center ${selectedAddress === address.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}
                  >
                    <Checkbox
                      checked={selectedAddress === address.id}
                      onPress={() => setSelectedAddress(address.id)}
                      style={tw`mr-3`}
                    />
                    <Text style={tw`flex-1`}>{addressText}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity style={tw`mt-4`} onPress={() => setShowAddAddress(true)}>
            <Text style={tw`text-indigo-600 underline text-center`}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={tw`mt-6`}>
          <TouchableOpacity
            style={tw`bg-gray-600 p-4 rounded-md mb-4 w-full items-center`}
            onPress={handleCancel}
          >
            <Text style={tw`text-white text-lg font-bold`}>Cancel</Text>
          </TouchableOpacity>

           <TouchableOpacity
             style={tw`bg-green-600 p-4 rounded-md mb-4 w-full items-center ${isAddressSelected ? 'opacity-100' : 'opacity-50'}`}
             disabled={!isAddressSelected}
             onPress={handleOrderCOD}
           >
             <Text style={tw`text-white text-lg font-bold`}>Order with Cash On Delivery</Text>
           </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-blue-600 p-4 rounded-md w-full items-center opacity-50`}
            disabled={true}
            onPress={handleOrderOnline}
          >
            <Text style={tw`text-white text-lg font-bold`}>Pay Online and Order</Text>
          </TouchableOpacity>
        </View>

        <BottomDialog open={showAddAddress} onClose={() => setShowAddAddress(false)}>
          <AddressForm
            onSuccess={() => {
              setShowAddAddress(false);
              queryClient.invalidateQueries({ queryKey: ['addresses'] });
            }}
          />
        </BottomDialog>
      </View>
    </ScrollView>
  );
}