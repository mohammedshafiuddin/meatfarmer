import { View, TouchableOpacity } from 'react-native';
import { AppContainer, MyText, CustomDropdown } from 'common-ui';
import { useRouter } from 'expo-router';
import { useGetSlots } from '@/src/api-hooks/slot.api';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

export default function ManageOrders() {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const { data: slotsData } = useGetSlots();

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slotsData.slots[0].id);
    }
  }, [slotsData]);

  return (
    <AppContainer>
      <MyText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
        Manage Orders
      </MyText>

      <View style={{ marginBottom: 20 }}>
        <CustomDropdown
          label='Select Slot'
          options={slotsData?.slots?.map(slot => ({ label: dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a'), value: slot.id })) || []}
          value={selectedSlotId || ''}
          onValueChange={val => setSelectedSlotId(Number(val))}
          placeholder="Select Slot"
        />
      </View>

      <View style={{ gap: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#2e7d32',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => router.push(`/(drawer)/packaging?slotId=${selectedSlotId}`)}
        >
          <MyText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Packaging
          </MyText>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#2e7d32',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => router.push(`/(drawer)/delivery?slotId=${selectedSlotId}`)}
        >
          <MyText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Delivery
          </MyText>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#2e7d32',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => router.push(`/(drawer)/delivery-sequences?slotId=${selectedSlotId}`)}
        >
          <MyText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Delivery Sequences
          </MyText>
        </TouchableOpacity>
      </View>
    </AppContainer>
  );
}