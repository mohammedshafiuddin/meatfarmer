import { View, TouchableOpacity, FlatList } from 'react-native';
import { AppContainer, MyText, BottomDropdown, tw } from 'common-ui';
import { useRouter } from 'expo-router';
import { useGetSlots } from '@/src/api-hooks/slot.api';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ManageOrders() {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const { data: slotsData } = useGetSlots();

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slotsData.slots[0].id);
    }
  }, [slotsData]);

  const menuItems = [
    {
      title: 'Packaging',
      icon: 'inventory',
      color: 'bg-green-500',
      onPress: () => router.push(`/(drawer)/packaging?slotId=${selectedSlotId}`),
    },
    {
      title: 'Delivery',
      icon: 'local-shipping',
      color: 'bg-blue-500',
      onPress: () => router.push(`/(drawer)/delivery?slotId=${selectedSlotId}`),
    },
    {
      title: 'Delivery Sequences',
      icon: 'route',
      color: 'bg-purple-500',
      onPress: () => router.push(`/(drawer)/delivery-sequences?slotId=${selectedSlotId}`),
    },
    {
      title: 'Product Quantities',
      icon: 'calculate',
      color: 'bg-orange-500',
      onPress: () => {
        if (selectedSlotId) {
          router.push(`/(drawer)/product-quantities?slotId=${selectedSlotId}`);
        }
      },
    },
    {
      title: 'Cancelled Orders',
      icon: 'cancel',
      color: 'bg-red-500',
      onPress: () => router.push(`/(drawer)/cancelled-orders`),
    },
  ];

  return (
    <View style={tw`flex-1`}>
      <FlatList
        data={menuItems}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`${item.color} p-6 rounded-2xl shadow-lg mb-4 flex-1`}
            onPress={item.onPress}
          >
            <View style={tw`items-center`}>
              <MaterialIcons name={item.icon as any} size={32} color="white" style={tw`mb-2`} />
              <MyText style={tw`text-white text-lg font-bold text-center`}>
                {item.title}
              </MyText>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={tw`justify-between gap-4`}
        contentContainerStyle={tw`p-6 gap-4 bg-white flex-1`}
        ListHeaderComponent={
          <>
            <View style={tw`mb-6`}>
              <BottomDropdown
                label='Select Slot'
                options={slotsData?.slots?.map(slot => ({ label: dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a'), value: slot.id })) || []}
                value={selectedSlotId || ''}
                onValueChange={val => setSelectedSlotId(Number(val))}
                placeholder="Select Slot"
              />
            </View>
          </>
        }
        
      />
    </View>
  );
}