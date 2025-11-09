import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import { TabViewWrapper, AppContainer, MyText, useManualRefresh, tw, BottomDialog } from 'common-ui';
import { Order } from 'common-ui/shared-types';
import { useLocalSearchParams } from 'expo-router';
import { OrderMenu } from '@/components/OrderMenu';
import { trpc } from '@/src/trpc-client';

const OrderItem = ({
  order,
  isPackagedTab,
  onTogglePackaged
}: {
  order: Order;
  isPackagedTab: boolean;
  onTogglePackaged: (orderId: string, isPackaged: boolean) => void;
}) => {
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <View style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <MyText style={tw`font-bold text-gray-800`}>{order.customerName} - #{order.readableId}</MyText>
        <View style={tw`flex-row items-center gap-2`}>
          <TouchableOpacity
            onPress={() => onTogglePackaged(order.orderId, !isPackagedTab)}
            style={tw`bg-blue-500 px-3 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white text-sm font-semibold`}>
              {isPackagedTab ? 'Mark not packaged' : 'Mark Packaged'}
            </MyText>
          </TouchableOpacity>
          <OrderMenu
            orderId={order.orderId}
            variant="packaging"
          />
        </View>
      </View>
      <MyText style={tw`text-gray-600 mb-1`} numberOfLines={1}>{order.address}</MyText>
      <MyText style={tw`text-gray-700`}>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity}) - ₹${item.amount}`).join(', ')}{moreItems}
      </MyText>
    </View>
  );
};

export default function Packaging() {
  const [index, setIndex] = useState(0);
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const { data: ordersResponse, isLoading, error, refetch, isRefetching } = trpc.admin.order.getSlotOrders.useQuery({slotId: String(selectedSlotId)}, {
    enabled: !!selectedSlotId,
  });
  const orders = ordersResponse?.data;
  const { data: slotsData } = trpc.admin.slots.getAll.useQuery();
  const updatePackagedMutation = trpc.admin.order.updatePackaged.useMutation();




  useManualRefresh(() => refetch());

  useEffect(() => {
    if (slotsData?.slots && slotsData.slots.length > 0 && !selectedSlotId) {
      // If no slotId from params, default to first slot
      // But since selectedSlotId is derived from params, this might not be needed
      // Keep for safety if slotId is invalid
    }
  }, [slotsData, selectedSlotId]);

  const notPackagedCount = (orders || []).filter(order => !order.isPackaged).length;
  const packagedCount = (orders || []).filter(order => order.isPackaged).length;

  const handleTogglePackaged = (orderId: string, isPackaged: boolean) => {
    updatePackagedMutation.mutate({ orderId, isPackaged });
  };



  const routes = [
    { key: 'not_packaged', title: `Not Packaged (${notPackagedCount})` },
    { key: 'packaged', title: `Packaged (${packagedCount})` },
  ];

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading orders...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading orders</MyText>
        </View>
      </AppContainer>
    );
  }

  const renderScene = ({ route }: any) => {
    const isPackagedTab = route.key === 'packaged';
    const filteredOrders = (orders || []).filter(order => {
      return route.key === 'not_packaged' ? !order.isPackaged : order.isPackaged;
    });
    return (
      <View style={tw`flex-1 p-4`}>
        {filteredOrders.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <MyText style={tw`text-gray-500`}>No orders</MyText>
          </View>
        ) : (
          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            {filteredOrders.map(order => <OrderItem key={order.readableId} order={order} isPackagedTab={isPackagedTab} onTogglePackaged={handleTogglePackaged} />)}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <AppContainer>
      <TabViewWrapper
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
      />




    </AppContainer>
  );
}