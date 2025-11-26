import React from 'react';
import { View, Text } from 'react-native';
import { AppContainer } from 'common-ui';
// import SlotForm from '../../../components/SlotForm';
// import { trpc } from '../../../src/trpc-client';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/src/trpc-client';
import SlotForm from '@/components/SlotForm';

export default function EditSlot() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const slotId = parseInt(id as string);

  const { data: slot, isLoading } = trpc.admin.slots.getSlotById.useQuery({ id: slotId });

  const handleSlotUpdated = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading slot...</Text>
        </View>
      </AppContainer>
    );
  }

  if (!slot) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Slot not found</Text>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <SlotForm
        initialDeliveryTime={new Date(slot.slot.deliveryTime)}
        initialFreezeTime={new Date(slot.slot.freezeTime)}
        initialIsActive={slot.slot.isActive}
        slotId={slot.slot.id}
        initialProductIds={slot.slot.products?.map(p => p.id) || []}
        onSlotAdded={handleSlotUpdated}
      />
    </AppContainer>
  );
}