import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer, MyText, tw, useMarkDataFetchers, MyFlatList } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AddressForm from '@/src/components/AddressForm';

interface Address {
  id: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }: {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}) {
  const formatAddress = (addr: Address) => {
    return `${addr.addressLine1}${addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  };

  return (
    <View style={tw`bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100`}>
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-1`}>
            <MyText weight="semibold" style={tw`text-lg text-gray-800 mr-2`}>
              {address.name}
            </MyText>
            {address.isDefault && (
              <View style={tw`bg-green-100 px-2 py-1 rounded-full`}>
                <MyText style={tw`text-green-700 text-xs font-medium`}>Default</MyText>
              </View>
            )}
          </View>
          <MyText style={tw`text-gray-600 text-sm mb-1`}>
            📞 {address.phone}
          </MyText>
          <MyText style={tw`text-gray-700 text-sm`}>
            📍 {formatAddress(address)}
          </MyText>
        </View>
      </View>

      <View style={tw`flex-row justify-end mt-3 space-x-2`}>
        {!address.isDefault && (
          <TouchableOpacity
            style={tw`bg-gray-500 px-3 py-2 rounded mr-2`}
            onPress={() => onSetDefault(address.id)}
          >
            <MyText style={tw`text-white text-xs font-medium`}>Set Default</MyText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={tw`bg-blue-500 px-3 py-2 rounded mr-2`}
          onPress={() => onEdit(address)}
        >
          <MyText style={tw`text-white text-xs font-medium`}>Edit</MyText>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`bg-red-500 px-3 py-2 rounded`}
          onPress={() => onDelete(address.id)}
        >
          <MyText style={tw`text-white text-xs font-medium`}>Delete</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Addresses() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { data, isLoading, error, refetch } = trpc.user.address.getUserAddresses.useQuery();

  useMarkDataFetchers(() => {
    refetch();
  });

  const addresses = data?.data || [];

  const updateAddressMutation = trpc.user.address.updateAddress.useMutation();

  const handleAddAddress = () => {
    setEditingAddress(null);
    setModalVisible(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setModalVisible(true);
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality when backend supports it
            Alert.alert('Info', 'Delete functionality will be implemented soon');
          }
        }
      ]
    );
  };

  const handleSetDefault = (id: number) => {
    // Update the address to be default
    const addressToUpdate = addresses.find(addr => addr.id === id);
    if (addressToUpdate) {
      updateAddressMutation.mutate({
        id: addressToUpdate.id,
        name: addressToUpdate.name,
        phone: addressToUpdate.phone,
        addressLine1: addressToUpdate.addressLine1,
        addressLine2: addressToUpdate.addressLine2 || undefined,
        city: addressToUpdate.city,
        state: addressToUpdate.state,
        pincode: addressToUpdate.pincode,
        isDefault: true,
      }, {
        onSuccess: () => {
          refetch();
          Alert.alert('Success', 'Default address updated');
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to update default address');
        }
      });
    }
  };

  const handleAddressSubmit = () => {
    setModalVisible(false);
    setEditingAddress(null);
    refetch();
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading addresses...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <MyText style={tw`text-red-600 text-center mt-2 mb-4`}>
            Failed to load addresses. Please try again.
          </MyText>
          <TouchableOpacity
            style={tw`bg-blue-500 px-4 py-2 rounded`}
            onPress={() => refetch()}
          >
            <MyText style={tw`text-white font-medium`}>Retry</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  return (
    <>
    <MyFlatList
        data={addresses}
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            onEdit={handleEditAddress}
            onDelete={handleDeleteAddress}
            onSetDefault={handleSetDefault}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View style={tw`flex-row justify-between items-center p-4 pb-2`}>
            <MyText weight="bold" style={tw`text-2xl text-gray-800`}>
              My Addresses
            </MyText>
            <TouchableOpacity
              style={tw`bg-blue-500 p-2 rounded-full`}
              onPress={handleAddAddress}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={tw`justify-center items-center py-12`}>
            <MaterialIcons name="location-off" size={64} color="#9CA3AF" />
            <MyText style={tw`text-gray-500 text-center mt-4 mb-2`}>
              No addresses found
            </MyText>
            <MyText style={tw`text-gray-400 text-center mb-6`}>
              Add your first delivery address
            </MyText>
            <TouchableOpacity
              style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
              onPress={handleAddAddress}
            >
              <MyText style={tw`text-white font-medium`}>Add Address</MyText>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <AppContainer>
          <View style={tw`flex-row justify-between items-center pb-2`}>
            <MyText weight="semibold" style={tw`text-lg text-gray-800`}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </MyText>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={tw`p-1`}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <AddressForm
            onSuccess={handleAddressSubmit}
            initialValues={editingAddress ? {
              name: editingAddress.name,
              phone: editingAddress.phone,
              addressLine1: editingAddress.addressLine1,
              addressLine2: editingAddress.addressLine2 || '',
              city: editingAddress.city,
              state: editingAddress.state,
              pincode: editingAddress.pincode,
              isDefault: editingAddress.isDefault,
            } : undefined}
            isEdit={!!editingAddress}
          />
        </AppContainer>
      </Modal>
    </>
  );
}