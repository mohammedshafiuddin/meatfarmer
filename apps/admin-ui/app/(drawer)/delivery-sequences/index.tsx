import React, { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { AppContainer, MyText, tw, useManualRefresh, useMarkDataFetchers } from "common-ui";
import { Order } from "common-ui/shared-types";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "@/src/trpc-client";

interface OrderWithSequence extends Order {
  sequenceId: number;
}

export default function DeliverySequences() {
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const [localOrderedOrders, setLocalOrderedOrders] = useState<
    OrderWithSequence[]
  >([]);

  // const { data: slotsData, refetch: refetchSlots } = useGetSlots();
  const { data: slotsData, refetch: refetchSlots } =
    trpc.admin.slots.getAll.useQuery();
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = trpc.admin.order.getSlotOrders.useQuery(
    { slotId: String(selectedSlotId) },
    {
      enabled: !!selectedSlotId,
    }
  );

  const { data: sequenceData, refetch: refetchSequence } =
    trpc.admin.slots.getDeliverySequence.useQuery(
      { id: String(selectedSlotId) },
      {
        enabled: !!selectedSlotId,
      }
    );

  const updateSequenceMutation = trpc.admin.slots.updateDeliverySequence.useMutation();

  // Manual refresh functionality
  useManualRefresh(() => {
    refetchSlots();
    refetchOrders();
    refetchSequence();
  });

  useMarkDataFetchers(() => {
    refetchSlots();
    refetchOrders();
    refetchSequence();
  });

  const slots = slotsData?.slots || [];
  const orders = ordersData?.data || [];
  const deliverySequence = sequenceData?.deliverySequence || [];

  // Create ordered orders based on delivery sequence
  const computedOrderedOrders = useMemo(() => {
    if (orders.length > 0) {
      // let ordered: OrderWithSequence[];
      if (deliverySequence.length > 0) {
        // Sort orders according to delivery sequence
        const sequenceMap = new Map(
          deliverySequence.map((id, index) => [id, index])
        );
        let ordered = orders
          .map((order) => ({ ...order, sequenceId: parseInt(order.orderId) }))
          .sort((a, b) => {
            const aIndex = sequenceMap.get(a.sequenceId) ?? Infinity;
            const bIndex = sequenceMap.get(b.sequenceId) ?? Infinity;
            return aIndex - bIndex;
          });
        return ordered;
      } else {
        // Default order by order ID if no sequence exists
        let ordered = orders
          .map((order) => ({ ...order, sequenceId: parseInt(order.orderId) }))
          .sort((a, b) => a.sequenceId - b.sequenceId);
        return ordered;
      }
    } else {
      return [];
    }
  }, [ordersData, sequenceData]);

  // Sync local state with computed orders
  useEffect(() => {
    setLocalOrderedOrders(computedOrderedOrders);
  }, [computedOrderedOrders]);

  const handleDragEnd = ({ data }: { data: OrderWithSequence[] }) => {
    setLocalOrderedOrders(data);
  };

  const handleSaveSequence = async () => {
    if (!selectedSlotId) return;

    const newSequence = localOrderedOrders.map((order) => order.sequenceId);

    try {
      await updateSequenceMutation.mutateAsync({
        id: selectedSlotId,
        deliverySequence: newSequence,
      });
      Alert.alert("Success", "Delivery sequence updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update delivery sequence");
    }
  };

  const renderOrderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<OrderWithSequence>) => {
    const orderItem = item as Order;
    return (
      <TouchableOpacity
        style={{
          padding: 16,
          marginVertical: 4,
          marginHorizontal: 16,
          backgroundColor: isActive ? "#f0f0f0" : "#fff",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ddd",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
        onLongPress={drag}
        disabled={updateSequenceMutation.isPending}
      >
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <MyText style={{ fontWeight: "bold", fontSize: 16 }}>
              Order #{orderItem.readableId}{" "}
              {orderItem.items
                .slice(0, 2)
                .map((i: any) => i.name)
                .join(", ")}
              {orderItem.items.length > 2 &&
                ` +${orderItem.items.length - 2} more`}
            </MyText>
            <MyText style={{ fontWeight: "bold", color: "#2e7d32" }}>
              ₹{orderItem.totalAmount}
            </MyText>
          </View>
          <MyText style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
            {[orderItem.address.split(",")[0], orderItem.address.split(",")[1]]
              .filter(Boolean)
              .join(", ")}
          </MyText>
        </View>
      </TouchableOpacity>
    );
  };

  const slotOptions = useMemo(
    () =>
      slots.map((slot) => ({
        label: `${dayjs(slot.deliveryTime).format("MMM DD, h:mm A")} - ${dayjs(
          slot.freezeTime
        ).format("h:mm A")}`,
        value: slot.id.toString(),
      })),
    [slots]
  );

  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        {selectedSlotId && (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingHorizontal: 16,
              }}
            >
              <MyText style={{ fontSize: 18, fontWeight: "bold" }}>
                Orders ({localOrderedOrders.length})
              </MyText>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2e7d32",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  opacity: updateSequenceMutation.isPending ? 0.6 : 1,
                }}
                onPress={handleSaveSequence}
                disabled={updateSequenceMutation.isPending}
              >
                <MyText style={{ color: "#fff", fontWeight: "bold" }}>
                  {updateSequenceMutation.isPending
                    ? "Saving..."
                    : "Save Sequence"}
                </MyText>
              </TouchableOpacity>
            </View>

            {ordersLoading ? (
              <MyText style={{ textAlign: "center", marginTop: 20 }}>
                Loading orders...
              </MyText>
            ) : localOrderedOrders.length === 0 ? (
              <MyText style={{ textAlign: "center", marginTop: 20 }}>
                No orders found for this slot
              </MyText>
            ) : (
              <MyText
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Long press and drag orders to reorder delivery sequence
              </MyText>
            )}

            <View style={{ flex: 1 }}>
              <DraggableFlatList
                data={localOrderedOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.sequenceId.toString()}
                onDragEnd={handleDragEnd}
                showsVerticalScrollIndicator={true}
                bounces={true}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
              />
            </View>
          </>
        )}
      </View>
    </AppContainer>
  );
}
