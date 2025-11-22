import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import dayjs from "dayjs";
import {
  TabViewWrapper,
  AppContainer,
  MyText,
  useManualRefresh,
  useMarkDataFetchers,
  tw,
} from "common-ui";
import { Order } from "common-ui/shared-types";
import { useLocalSearchParams } from "expo-router";
import { OrderMenu } from "@/components/OrderMenu";
import { trpc } from "@/src/trpc-client";

const DeliveryOrderItem = ({
  order,
  isDeliveredTab,
  onToggleDelivered,
}: {
  order: Order;
  isDeliveredTab: boolean;
  onToggleDelivered: (orderId: string, isDelivered: boolean) => void;
}) => {
  return (
    <View style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <MyText style={tw`font-bold text-gray-800`}>
          {order.customerName} - #{order.readableId}
        </MyText>
        <View style={tw`flex-row items-center gap-2`}>
          <TouchableOpacity
            onPress={() => onToggleDelivered(order.orderId, !isDeliveredTab)}
            style={tw`bg-blue-500 px-3 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white text-sm font-semibold`}>
              {isDeliveredTab ? "Mark not delivered" : "Mark Delivered"}
            </MyText>
          </TouchableOpacity>
          <OrderMenu orderId={order.id} variant="delivery" />
        </View>
      </View>
      <MyText style={tw`text-gray-600 mb-1`} numberOfLines={1}>
        {order.address}
      </MyText>
      <MyText style={tw`text-gray-700`}>
        ₹{order.totalAmount}
        {order.isCod ? "" : " (paid)"}
      </MyText>
    </View>
  );
};

export default function Delivery() {
  const [index, setIndex] = useState(0);
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = trpc.admin.order.getSlotOrders.useQuery(
    { slotId: String(selectedSlotId) },
    {
      enabled: !!selectedSlotId,
    }
  );
  const orders = ordersResponse?.data;
  const { data: slotsData, refetch: refetchSlots } = trpc.admin.slots.getAll.useQuery();
  const updateDeliveredMutation = trpc.admin.order.updateDelivered.useMutation();

  useManualRefresh(() => refetch());

  useMarkDataFetchers(() => {
    refetch();
    refetchSlots();
  });

  const notDeliveredCount = (orders || []).filter(
    (order) => !order.isDelivered
  ).length;
  const deliveredCount = (orders || []).filter(
    (order) => order.isDelivered
  ).length;

  const routes = [
    { key: "not_delivered", title: `Not Delivered (${notDeliveredCount})` },
    { key: "delivered", title: `Delivered (${deliveredCount})` },
  ];

  const handleToggleDelivered = (orderId: string, isDelivered: boolean) => {
    updateDeliveredMutation.mutate({ orderId, isDelivered });
  };

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
    const isDeliveredTab = route.key === "delivered";
    const filteredOrders = (orders || []).filter((order) => {
      return route.key === "not_delivered"
        ? !order.isDelivered
        : order.isDelivered;
    });
    return (
      <View style={tw`flex-1 p-4`}>
        {filteredOrders.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <MyText style={tw`text-gray-500`}>No orders</MyText>
          </View>
        ) : (
          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            {filteredOrders.map((order) => (
              <DeliveryOrderItem
                key={order.readableId}
                order={order}
                isDeliveredTab={isDeliveredTab}
                onToggleDelivered={handleToggleDelivered}
              />
            ))}
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
        initialLayout={{ width: Dimensions.get("window").width }}
      />
    </AppContainer>
  );
}
