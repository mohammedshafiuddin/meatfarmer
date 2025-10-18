import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AppContainer } from 'common-ui';
import dayjs from 'dayjs';
import { useGetSlots } from '../../../src/api-hooks/slot.api';
import { useGetAllProductsSummary, useGetSlotsProductIds } from 'common-ui/src/common-api-hooks/product.api';
import { useUpdateSlotProducts } from '../../../src/api-hooks/product.api';
import MultiSelectDropdown, { DropdownOption } from 'common-ui/src/components/multi-select';

export default function ManageSlots() {

  // Fetch data
  const { data: slotsData, isLoading: slotsLoading } = useGetSlots();
  const { data: productsData, isLoading: productsLoading } = useGetAllProductsSummary();
  console.log({productsData})
  

  const slots = slotsData?.slots || [];
  const products = productsData?.products || [];
  const sortedSlots = useMemo(() =>
    [...slots].sort((a, b) => new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime()),
    [slots]
  );
  const slotIds = useMemo(() => sortedSlots.map(slot => slot.id), [sortedSlots]);

  const { data: associationsData, isLoading: associationsLoading } = useGetSlotsProductIds(slotIds);

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
  }, [associationsData, selectedProducts]);

  // Prepare dropdown options
  const productOptions: DropdownOption[] = useMemo(() => {
    return products.map(product => ({
      label: product.name,
      value: product.id.toString(),
    }));
  }, [products]);

  // Update slot products mutation
  const { mutate: updateSlotProducts, isPending: isUpdatingSlotProducts } = useUpdateSlotProducts();

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
    <AppContainer>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Manage Slots</Text>

        {sortedSlots.map(slot => (
          <View key={slot.id} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {dayjs(slot.deliveryTime).format('ddd DD MMM, h a')}
            </Text>
            <Text style={{ marginBottom: 12, color: '#666' }}>
              Freeze Time: {dayjs(slot.freezeTime).format('ddd DD MMM, h a')} | Active: {slot.isActive ? 'Yes' : 'No'}
            </Text>

            <Text style={{ fontSize: 16, marginBottom: 8 }}>Select Products:</Text>
            <MultiSelectDropdown
              data={productOptions}
              value={selectedProducts[slot.id] || []}
              onChange={(values) => handleProductChange(slot.id, values)}
              placeholder="Select products for this slot"
              search={true}
              maxHeight={200}
            />

            <TouchableOpacity
              onPress={() => handleSaveSlot(slot.id)}
              disabled={isUpdatingSlotProducts}
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: isUpdatingSlotProducts ? '#ccc' : '#007AFF',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {isUpdatingSlotProducts ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {sortedSlots.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 32 }}>No slots available</Text>
        )}
    </AppContainer>
  );
}