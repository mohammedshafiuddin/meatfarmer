import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { AppContainer, MyText, tw, MyFlatList } from 'common-ui';
import { BottomDialog } from 'common-ui';
import { trpc } from '../../../src/trpc-client';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

export default function Slots() {
  const router = useRouter();
  const { data: slotsData, isLoading } = trpc.admin.slots.getAll.useQuery();

  const slots = slotsData?.slots || [];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProducts, setDialogProducts] = useState<any[]>([]);

  const renderSlot = ({ item: slot }: { item: any }) => {
    const slotProducts = slot.products?.map((p: any) => p.name).filter(Boolean) || [];
    const displayProducts = slotProducts.slice(0, 2).join(', ');

    const isActive = slot.isActive;
    const statusColor = isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    const statusText = isActive ? 'Active' : 'Inactive';

    return (
      <View style={tw`bg-white p-5 mb-4 rounded-3xl shadow-sm border border-gray-100`}>
        {/* Header: ID and Status */}
         <View style={tw`flex-row justify-between items-center mb-4`}>
           <View style={tw`flex-row items-center`}>
              <View style={tw`w-10 h-10 bg-pink2 rounded-full items-center justify-center mr-3`}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#F83758" />
             </View>
             <View>
               <MyText style={tw`text-lg font-bold text-gray-900`}>Slot #{slot.id}</MyText>
               <MyText style={tw`text-xs text-gray-500`}>ID: {slot.id}</MyText>
             </View>
           </View>
           <View style={tw`flex-row items-center`}>
              <TouchableOpacity
                 onPress={() => router.push(`/edit-slot/${slot.id}` as any)}
                style={tw`px-3 py-1 rounded-full bg-pink2 mr-2`}
              >
                <View style={tw`flex-row items-center`}>
                  <MaterialCommunityIcons name="pencil" size={12} color="#F83758" style={tw`mr-1`} />
                  <MyText style={tw`text-xs font-bold text-pink1`}>Edit</MyText>
               </View>
             </TouchableOpacity>
             <View style={tw`px-3 py-1 rounded-full ${statusColor.split(' ')[0]}`}>
               <MyText style={tw`text-xs font-bold ${statusColor.split(' ')[1]}`}>{statusText}</MyText>
             </View>
           </View>
         </View>

        {/* Divider */}
        <View style={tw`h-[1px] bg-gray-100 mb-4`} />

        {/* Details Grid */}
        <View style={tw`flex-row flex-wrap`}>
          {/* Delivery Time */}
          <View style={tw`w-1/2 mb-4 pr-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={14} color="#6b7280" style={tw`mr-1`} />
              <MyText style={tw`text-xs text-gray-500 uppercase font-semibold tracking-wider`}>Delivery</MyText>
            </View>
            <MyText style={tw`text-sm font-medium text-gray-800`}>
              {dayjs(slot.deliveryTime).format('DD MMM, h:mm A')}
            </MyText>
          </View>

          {/* Freeze Time */}
          <View style={tw`w-1/2 mb-4 pl-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <MaterialCommunityIcons name="snowflake" size={14} color="#6b7280" style={tw`mr-1`} />
              <MyText style={tw`text-xs text-gray-500 uppercase font-semibold tracking-wider`}>Freeze</MyText>
            </View>
            <MyText style={tw`text-sm font-medium text-gray-800`}>
              {dayjs(slot.freezeTime).format('DD MMM, h:mm A')}
            </MyText>
          </View>
        </View>

        {/* Products */}
        {slotProducts.length > 0 ? (
          <View style={tw`bg-gray-50 p-3 rounded-xl mt-1`}>
            <View style={tw`flex-row items-start`}>
              <MaterialCommunityIcons name="basket-outline" size={16} color="#4b5563" style={tw`mr-2 mt-0.5`} />
              <View style={tw`flex-1`}>
                <MyText style={tw`text-xs text-gray-500 mb-0.5`}>Products</MyText>
                <View style={tw`flex-row items-center flex-wrap`}>
                  <MyText style={tw`text-sm text-gray-800 leading-5`}>{displayProducts}</MyText>
                  {slotProducts.length > 2 && (
                    <TouchableOpacity
                      onPress={() => {
                        setDialogProducts(slotProducts);
                        setDialogOpen(true);
                      }}
                    >
                      <MyText style={tw`text-sm text-pink1 font-semibold ml-1`}>
                        +{slotProducts.length - 2} more
                      </MyText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <MyText>Loading slots...</MyText>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <MyFlatList
        data={slots}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSlot}
        ListHeaderComponent={() => (
          <View style={tw`p-4 bg-gray-100`}>
            <TouchableOpacity
              onPress={() => router.push('/add-slot' as any)}
              style={tw`bg-pink1 p-3 rounded-lg items-center`}
            >
              <MyText style={tw`text-white font-bold`}>Add New</MyText>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={tw`p-4`}
      />

      {/* Products Dialog */}
      <BottomDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <View style={tw`p-4`}>
          <MyText style={tw`text-lg font-bold mb-4`}>All Products</MyText>
          <FlatList
            data={dialogProducts}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={tw`py-2 border-b border-gray-200`}>
                <MyText style={tw`text-base`}>{item}</MyText>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            style={tw`max-h-80`}
          />
        </View>
      </BottomDialog>
    </View>
  );
}