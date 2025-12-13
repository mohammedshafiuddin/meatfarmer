import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { tw, BottomDialog } from 'common-ui';
import { useQueryClient } from '@tanstack/react-query';
import AddressForm from '@/src/components/AddressForm';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { trpc } from '@/src/trpc-client';

interface AddressSelectorProps {
  selectedAddress: number | null;
  onAddressSelect: (addressId: number) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddress,
  onAddressSelect,
}) => {
  const [showAddAddress, setShowAddAddress] = useState(false);
  const queryClient = useQueryClient();
  const { data: addresses } = trpc.user.address.getUserAddresses.useQuery();

  return (
    <>
      <View style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3`}
            >
              <MaterialIcons name="location-on" size={18} color="#3B82F6" />
            </View>
            <Text style={tw`text-base font-bold text-gray-900`}>
              Delivery Address
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddAddress(true)}>
            <Text style={tw`text-brand500 font-bold text-sm`}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {(!addresses?.data || addresses?.data.length === 0) ? (
          <View style={tw`bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed items-center justify-center`}>
            <MaterialIcons name="location-off" size={32} color="#9CA3AF" />
            <Text style={tw`text-gray-500 mt-2`}>No addresses found</Text>
            <TouchableOpacity onPress={() => setShowAddAddress(true)} style={tw`mt-3 bg-brand500 px-4 py-2 rounded-lg`}>
              <Text style={tw`text-white font-bold text-sm`}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`pb-2`}>
            {addresses.data.map((address) => (
              <TouchableOpacity
                key={address.id}
                onPress={() => onAddressSelect(address.id)}
                style={tw`w-72 p-4 mr-3 bg-gray-50 rounded-xl border-2 ${selectedAddress === address.id ? 'border-brand500 bg-blue-50' : 'border-gray-200'
                  } shadow-sm`}
              >
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <View style={tw`flex-row items-center`}>
                    <MaterialIcons
                      name={address.name.toLowerCase().includes('home') ? 'home' : address.name.toLowerCase().includes('work') ? 'work' : 'location-on'}
                      size={20}
                      color={selectedAddress === address.id ? '#EC4899' : '#6B7280'}
                    />
                    <Text style={tw`font-bold ml-2 ${selectedAddress === address.id ? 'text-brand500' : 'text-gray-900'}`}>
                      {address.name}
                    </Text>
                  </View>
                  {selectedAddress === address.id && (
                    <View style={tw`bg-brand500 w-5 h-5 rounded-full items-center justify-center`}>
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

      <BottomDialog open={showAddAddress} onClose={() => setShowAddAddress(false)}>
        <AddressForm
          onSuccess={() => {
            setShowAddAddress(false);
            queryClient.invalidateQueries();
          }}
        />
      </BottomDialog>
    </>
  );
};

export default AddressSelector;