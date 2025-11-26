import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import DateTimePickerMod from 'common-ui/src/components/date-time-picker';
import { tw } from 'common-ui';
import { trpc } from '../src/trpc-client';
import BottomDropdown, { DropdownOption } from 'common-ui/src/components/bottom-dropdown';

interface SlotFormProps {
  onSlotAdded?: () => void;
  initialDeliveryTime?: Date | null;
  initialFreezeTime?: Date | null;
  initialIsActive?: boolean;
  slotId?: number;
  initialProductIds?: number[];
}

export default function SlotForm({
  onSlotAdded,
  initialDeliveryTime,
  initialFreezeTime,
  initialIsActive = true,
  slotId,
  initialProductIds = [],
}: SlotFormProps) {
  const [deliveryTime, setDeliveryTime] = useState<Date | null>(initialDeliveryTime || null);
  const [freezeTime, setFreezeTime] = useState<Date | null>(initialFreezeTime || null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>(initialProductIds);

  const { mutate: createSlot, isPending: isCreating } = trpc.admin.slots.createSlot.useMutation();
  const { mutate: updateSlot, isPending: isUpdating } = trpc.admin.slots.updateSlot.useMutation();

  const isEditMode = !!slotId;
  const isPending = isCreating || isUpdating;

  // Fetch products
  const { data: productsData } = trpc.common.product.getAllProductsSummary.useQuery({});
  const products = productsData?.products || [];

  const productOptions: DropdownOption[] = useMemo(() => {
    return products.map(product => ({
      label: product.name,
      value: product.id.toString(),
    }));
  }, [products]);

  // Update state when props change
  useEffect(() => {
    setDeliveryTime(initialDeliveryTime || null);
    setFreezeTime(initialFreezeTime || null);
    setSelectedProducts(initialProductIds);
  }, [initialDeliveryTime]);

  const handleSubmit = () => {
    if (!deliveryTime || !freezeTime) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const slotData = {
      deliveryTime: deliveryTime.toISOString(),
      freezeTime: freezeTime.toISOString(),
      isActive: initialIsActive,
      productIds: selectedProducts,
    };

    if (isEditMode && slotId) {
      updateSlot(
        { id: slotId, ...slotData },
        {
          onSuccess: () => {
            Alert.alert('Success', 'Slot updated successfully!');
            onSlotAdded?.();
          },
          onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to update slot');
          },
        }
      );
    } else {
      createSlot(
        slotData,
        {
          onSuccess: () => {
            Alert.alert('Success', 'Slot created successfully!');
            // Reset form
            setDeliveryTime(null);
            setFreezeTime(null);
            setSelectedProducts([]);
            onSlotAdded?.();
          },
          onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to create slot');
          },
        }
      );
    }
  };



  return (
    <View style={tw`mb-4`}>
      <Text style={tw`text-xl font-bold mb-6 text-center`}>
        {isEditMode ? 'Edit Slot' : 'Create New Slot'}
      </Text>

      <View style={tw`mb-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Delivery Date & Time</Text>
        <DateTimePickerMod value={deliveryTime} setValue={setDeliveryTime} />
      </View>

      <View style={tw`mb-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Freeze Date & Time</Text>
        <DateTimePickerMod value={freezeTime} setValue={setFreezeTime} />
      </View>

      <View style={tw`mb-4`}>
        <Text style={tw`text-base mb-2`}>Select Products (Optional)</Text>
        <BottomDropdown
          label="Select Products"
          options={productOptions}
          value={selectedProducts.map(id => id.toString())}
          onValueChange={(value) => {
            const selectedValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
            setSelectedProducts(selectedValues.map(v => parseInt(v)));
          }}
          placeholder="Select products for this slot"
          multiple={true}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isPending}
        style={tw`${isPending ? 'bg-pink2' : 'bg-pink1'} p-3 rounded-lg items-center mt-6 pb-4`}
      >
        <Text style={tw`text-white text-base font-bold`}>
          {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Slot' : 'Create Slot')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}