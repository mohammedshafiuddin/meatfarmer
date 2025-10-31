import { View, TouchableOpacity } from 'react-native';
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

  return (
    <AppContainer>
      <MyText style={tw`text-3xl font-bold mb-8 text-center text-gray-800`}>
        Manage Orders
      </MyText>

      <View style={tw`mb-6`}>
        <BottomDropdown
          label='Select Slot'
          options={slotsData?.slots?.map(slot => ({ label: dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a'), value: slot.id })) || []}
          value={selectedSlotId || ''}
          onValueChange={val => setSelectedSlotId(Number(val))}
          placeholder="Select Slot"
        />
      </View>

       <View style={tw`gap-4`}>
         <TouchableOpacity
           style={tw`bg-green-500 p-6 rounded-2xl shadow-lg`}
           onPress={() => router.push(`/(drawer)/packaging?slotId=${selectedSlotId}`)}
         >
           <View style={tw`items-center`}>
             <MaterialIcons name="inventory" size={32} color="white" style={tw`mb-2`} />
             <MyText style={tw`text-white text-xl font-bold text-center`}>
               Packaging
             </MyText>
           </View>
         </TouchableOpacity>

         <TouchableOpacity
           style={tw`bg-blue-500 p-6 rounded-2xl shadow-lg`}
           onPress={() => router.push(`/(drawer)/delivery?slotId=${selectedSlotId}`)}
         >
           <View style={tw`items-center`}>
             <MaterialIcons name="local-shipping" size={32} color="white" style={tw`mb-2`} />
             <MyText style={tw`text-white text-xl font-bold text-center`}>
               Delivery
             </MyText>
           </View>
         </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-purple-500 p-6 rounded-2xl shadow-lg`}
            onPress={() => router.push(`/(drawer)/delivery-sequences?slotId=${selectedSlotId}`)}
          >
            <View style={tw`items-center`}>
              <MaterialIcons name="route" size={32} color="white" style={tw`mb-2`} />
              <MyText style={tw`text-white text-xl font-bold text-center`}>
                Delivery Sequences
              </MyText>
            </View>
          </TouchableOpacity>

           <TouchableOpacity
             style={tw`bg-orange-500 p-6 rounded-2xl shadow-lg`}
             onPress={() => {
               if (selectedSlotId) {
                 router.push(`/(drawer)/product-quantities?slotId=${selectedSlotId}`);
               }
             }}
           >
             <View style={tw`items-center`}>
               <MaterialIcons name="calculate" size={32} color="white" style={tw`mb-2`} />
               <MyText style={tw`text-white text-xl font-bold text-center`}>
                 Product Quantities
               </MyText>
             </View>
           </TouchableOpacity>

           <TouchableOpacity
             style={tw`bg-red-500 p-6 rounded-2xl shadow-lg`}
             onPress={() => router.push(`/(drawer)/cancelled-orders`)}
           >
             <View style={tw`items-center`}>
               <MaterialIcons name="cancel" size={32} color="white" style={tw`mb-2`} />
               <MyText style={tw`text-white text-xl font-bold text-center`}>
                 Cancelled Orders
               </MyText>
             </View>
           </TouchableOpacity>
       </View>
    </AppContainer>
  );
}