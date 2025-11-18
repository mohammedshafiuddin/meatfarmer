import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AppContainer, theme, tw, useManualRefresh, MyFlatList } from 'common-ui';
import dayjs from 'dayjs';
import { trpc } from '../../../src/trpc-client';
import BottomDropdown, { DropdownOption } from 'common-ui/src/components/bottom-dropdown';


export default function AvailabilityTab() {
  // Fetch data
  const { data: slotsData, isFetching: slotsLoading, refetch: refetchSlots } = trpc.admin.slots.getAll.useQuery();
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = trpc.common.product.getAllProductsSummary.useQuery({});
  
  useManualRefresh(() => { refetchSlots(); refetchProducts(); });

  const slots = slotsData?.slots || [];
  const products = productsData?.products || [];
  const sortedSlots = useMemo(() =>
    [...slots].sort((a, b) => new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime()),
    [slots]
  );
  const slotIds = useMemo(() => sortedSlots.map(slot => slot.id), [sortedSlots]);

  const { data: associationsData, isFetching: associationsLoading, refetch: refetchSlotProducts } = trpc.admin.slots.getSlotsProductIds.useQuery({ slotIds }, {
    enabled: slotIds.length > 0,
  });
  

  useManualRefresh(() => {
    refetchSlots();
    refetchSlotProducts();
  });


  // State for selected products per slot
  const [selectedProducts, setSelectedProducts] = useState<Record<number, string[]>>({});

  // Initialize selected products when associations load
  React.useEffect(() => {
    if (associationsData && Object.keys(selectedProducts).length === 0) {
      const initialSelected: Record<number, string[]> = {};
      Object.entries(associationsData).forEach(([slotId, productIds]) => {
        initialSelected[parseInt(slotId)] = productIds.map((id:any) => id.toString());
      });
      setSelectedProducts(initialSelected);
    }
  }, [associationsData]);

  // Prepare dropdown options
  const productOptions: DropdownOption[] = useMemo(() => {
    return products.map(product => ({
      label: product.name,
      value: product.id.toString(),
    }));
  }, [products]);

  // Update slot products mutation
  const utils = trpc.useUtils();
  const { mutate: updateSlotProducts, isPending: isUpdatingSlotProducts } = trpc.admin.slots.updateSlotProducts.useMutation({
    onSuccess: () => {
      utils.admin.slots.getSlotsProductIds.invalidate();
      utils.admin.slots.getAll.invalidate();
    },
  });

  const handleSaveSlot = (slotId: number) => {
    const productIds = selectedProducts[slotId]?.map(id => parseInt(id)) || [];
    updateSlotProducts(
      { slotId, productIds },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Slot products updated successfully');
        },
        onError: (error) => {
          Alert.alert('Error', 'Failed to update slot products');
          console.error('Update error:', error);
        },
      }
    );
  };

  const handleProductChange = (slotId: number, selectedValues: string[]) => {
    setSelectedProducts(prev => ({
      ...prev,
      [slotId]: selectedValues,
    }));
  };

  if (slotsLoading || productsLoading || associationsLoading) {
    return (
      <AppContainer>
        <View style={{ padding: 16 }}>
          <Text>Loading...</Text>
        </View>
      </AppContainer>
    );
  }

  return (
    <View style={[tw`px-6 pt-4 bg-white`,{ flex: 1 }]}>

        <MyFlatList
          data={sortedSlots}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={() => (
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Manage Product Availability</Text>
          )}
          renderItem={({ item: slot }) => (
            <View style={{ marginBottom: 24, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                {dayjs(slot.deliveryTime).format('ddd DD MMM, h a')}
              </Text>
              <Text style={{ marginBottom: 12, color: '#666' }}>
                Freeze Time: {dayjs(slot.freezeTime).format('ddd DD MMM, h a')} | Active: {slot.isActive ? 'Yes' : 'No'}
              </Text>

              <Text style={{ fontSize: 16, marginBottom: 8 }}>Select Products:</Text>
              <BottomDropdown
                label="Select Products"
                options={productOptions}
                value={selectedProducts[slot.id] || []}
                onValueChange={(values) => handleProductChange(slot.id, values as string[])}
                placeholder="Select products for this slot"
                multiple={true}
              />

              <TouchableOpacity
                onPress={() => handleSaveSlot(slot.id)}
                disabled={isUpdatingSlotProducts}
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: isUpdatingSlotProducts ? '#ccc' : theme.colors.pink1,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {isUpdatingSlotProducts ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No slots available</Text>}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`bg-white`}
        />
    </View>
  );
}