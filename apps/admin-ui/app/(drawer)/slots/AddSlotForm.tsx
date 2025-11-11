import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import DateTimePickerMod from 'common-ui/src/components/date-time-picker';
import { tw } from 'common-ui';
import { trpc } from '@/src/trpc-client';

interface AddSlotFormProps {
  onSlotAdded?: () => void;
  initialDeliveryTime?: Date | null;
  initialFreezeTime?: Date | null;
  initialIsActive?: boolean;
  slotId?: number;
}

export default function AddSlotForm({
  onSlotAdded,
  initialDeliveryTime,
  initialFreezeTime,
  initialIsActive = true,
  slotId
}: AddSlotFormProps) {
  const [deliveryTime, setDeliveryTime] = useState<Date | null>(initialDeliveryTime || null);
  const [freezeTime, setFreezeTime] = useState<Date | null>(initialFreezeTime || null);

  const { mutate: createSlot, isPending: isCreating } = trpc.admin.slots.createSlot.useMutation();
  const { mutate: updateSlot, isPending: isUpdating } = trpc.admin.slots.updateSlot.useMutation();

  const isEditMode = !!slotId;
  const isPending = isCreating || isUpdating;

  // Update state when props change
  useEffect(() => {
    setDeliveryTime(initialDeliveryTime || null);
    setFreezeTime(initialFreezeTime || null);
  }, [initialDeliveryTime, initialFreezeTime]);

  const handleSubmit = () => {
    if (!deliveryTime || !freezeTime) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const slotData = {
      deliveryTime: deliveryTime.toISOString(),
      freezeTime: freezeTime.toISOString(),
      isActive: initialIsActive
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
        {isEditMode ? 'Edit Slot' : 'Add New Slot'}
      </Text>

      <View style={tw`mb-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Delivery Date & Time</Text>
        <DateTimePickerMod value={deliveryTime} setValue={setDeliveryTime} />
      </View>

      <View style={tw`mb-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Freeze Date & Time</Text>
        <DateTimePickerMod value={freezeTime} setValue={setFreezeTime} />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isPending}
        style={tw`${isPending ? 'bg-pink2' : 'bg-pink1'} p-3 rounded-lg items-center mt-6 pb-4`}
      >
        <Text style={tw`text-white text-base font-bold`}>
          {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Slot' : 'Add Slot')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}