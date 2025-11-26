import React from 'react';
import { View } from 'react-native';
import { AppContainer } from 'common-ui';
import SlotForm from '../../../components/SlotForm';
import { useRouter } from 'expo-router';
import { trpc } from '../../../src/trpc-client';

export default function AddSlot() {
  const router = useRouter();
  const { refetch } = trpc.admin.slots.getAll.useQuery();

  const handleSlotAdded = () => {
    refetch();
    router.back();
  };

  return (
    <AppContainer>
      <SlotForm onSlotAdded={handleSlotAdded} />
    </AppContainer>
  );
}