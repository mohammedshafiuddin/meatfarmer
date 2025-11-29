import React, { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Alert, ActivityIndicator, Linking } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { AppContainer, MyText, tw, useManualRefresh, useMarkDataFetchers, BottomDialog } from "common-ui";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/src/trpc-client";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import * as Location from 'expo-location';

export default function DeliverySequences() {
  const { slotId } = useLocalSearchParams();
  const selectedSlotId = slotId ? Number(slotId) : null;
  const [localOrderedOrders, setLocalOrderedOrders] = useState<
    OrderWithSequence[]
  >([]);
  const [showOrderMenu, setShowOrderMenu] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithSequence | null>(null);
  const router = useRouter();

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
  const updatePackagedMutation = trpc.admin.order.updatePackaged.useMutation();
  const updateDeliveredMutation = trpc.admin.order.updateDelivered.useMutation();
  const updateAddressCoordsMutation = trpc.admin.order.updateAddressCoords.useMutation();

  type OrderType = NonNullable<typeof ordersData>['data'][0];
  interface OrderWithSequence extends OrderType {
    sequenceId: number;
  }

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
      if (deliverySequence.length > 0) {
        // Sort orders according to delivery sequence
        const sequenceMap = new Map(
          deliverySequence.map((id, index) => [id, index])
        );
        let ordered = orders
          .map((order) => ({ ...order, sequenceId: order.id }))
          .sort((a, b) => {
            const aIndex = sequenceMap.get(a.sequenceId) ?? Infinity;
            const bIndex = sequenceMap.get(b.sequenceId) ?? Infinity;
            return aIndex - bIndex;
          });
        return ordered;
      } else {
        // Default order by order ID if no sequence exists
        let ordered = orders
          .map((order) => ({ ...order, sequenceId: order.id }))
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
    const orderItem = item;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={updateSequenceMutation.isPending}
          activeOpacity={1}
          style={tw`mx-4 my-2`}
        >
          <View
            style={[
              tw`bg-white p-4 rounded-xl flex-row items-center border`,
              isActive
                ? tw`shadow-xl border-blue-500 z-50`
                : tw`shadow-sm border-gray-100`,
            ]}
          >
            {/* Drag Handle */}
            <View style={tw`mr-4`}>
              <MaterialIcons
                name="drag-indicator"
                size={24}
                color={isActive ? "#3b82f6" : "#9ca3af"}
              />
            </View>

            {/* Content */}
            <View style={tw`flex-1`}>
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <View>
                  <MyText style={tw`font-bold text-gray-800 text-lg`}>
                    Order #{orderItem.readableId}
                  </MyText>
                  {/* Optional: Add time if available, or just keep ID */}
                </View>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-green-50 px-2 py-1 rounded-lg border border-green-100 mr-2`}>
                    <MyText style={tw`font-bold text-green-700 text-sm`}>
                      ₹{orderItem.totalAmount}
                    </MyText>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOrder(orderItem);
                      setShowOrderMenu(true);
                    }}
                    style={tw`p-2`}
                  >
                    <Entypo name="dots-three-vertical" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={tw`mb-3`}>
                <MyText style={tw`text-gray-600 text-sm`} numberOfLines={2}>
                  {orderItem.items.map((i: any) => i.name).join(", ")}
                  {orderItem.items.length > 2 &&
                    ` +${orderItem.items.length - 2} more`}
                </MyText>
              </View>

               <View style={tw`flex-row items-start`}>
                 <MaterialIcons
                   name="location-on"
                   size={14}
                   color="#6b7280"
                   style={tw`mr-1 mt-0.5`}
                 />
                 <MyText
                   style={tw`text-gray-500 text-xs flex-1`}
                   numberOfLines={2}
                 >
                   {orderItem.address}
                 </MyText>
                 {orderItem.latitude && orderItem.longitude && (
                   <TouchableOpacity
                     onPress={() => {
                       Linking.openURL(`https://www.google.com/maps?q=${orderItem.latitude},${orderItem.longitude}`);
                     }}
                     style={tw`ml-2`}
                   >
                     <MaterialIcons name="map" size={16} color="#3b82f6" />
                   </TouchableOpacity>
                 )}
               </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {selectedSlotId ? (
        <>
          {/* Header Section */}
          <View style={tw`bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center shadow-sm z-10`}>
            <View>
              <MyText style={tw`text-xl font-bold text-gray-900`}>
                Delivery Sequence
              </MyText>
              <MyText style={tw`text-sm text-gray-500`}>
                {localOrderedOrders.length} Orders
              </MyText>
            </View>

            <TouchableOpacity
              style={[
                tw`flex-row items-center px-4 py-2 rounded-full shadow-sm`,
                updateSequenceMutation.isPending ? tw`bg-gray-400` : tw`bg-blue-600`
              ]}
              onPress={handleSaveSequence}
              disabled={updateSequenceMutation.isPending}
            >
              {updateSequenceMutation.isPending ? (
                <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
              ) : (
                <MaterialIcons name="save" size={18} color="white" style={tw`mr-2`} />
              )}
              <MyText style={tw`text-white font-bold text-sm`}>
                {updateSequenceMutation.isPending ? "Saving..." : "Save"}
              </MyText>
            </TouchableOpacity>
          </View>

          {/* Content Section */}
          {ordersLoading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <MyText style={tw`text-gray-500 mt-4`}>Loading orders...</MyText>
            </View>
          ) : localOrderedOrders.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center p-8`}>
              <MaterialIcons name="assignment-late" size={64} color="#e5e7eb" />
              <MyText style={tw`text-gray-500 mt-4 text-center text-lg`}>
                No orders found for this slot
              </MyText>
            </View>
          ) : (
            <View style={tw`flex-1`}>
              <View style={tw`bg-blue-50 px-4 py-2 mb-2`}>
                <MyText style={tw`text-blue-700 text-xs text-center`}>
                  Long press an item to drag and reorder
                </MyText>
              </View>
              <DraggableFlatList
                data={localOrderedOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.sequenceId.toString()}
                onDragEnd={handleDragEnd}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-8 pt-2`}
              />
            </View>
          )}
        </>
      ) : (
        <View style={tw`flex-1 justify-center items-center p-8`}>
          <MaterialIcons name="event-busy" size={64} color="#e5e7eb" />
          <MyText style={tw`text-gray-500 mt-4 text-center text-lg`}>
            No slot selected. Please select a slot to view delivery sequence.
          </MyText>
          <TouchableOpacity
            style={tw`mt-6 bg-blue-600 px-6 py-3 rounded-full`}
            onPress={() => router.back()}
          >
            <MyText style={tw`text-white font-bold`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Menu Dialog */}
      <BottomDialog open={showOrderMenu} onClose={() => setShowOrderMenu(false)}>
        <View style={tw`pb-8 pt-2 px-4`}>
          {/* Handle Bar */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-12 h-1.5 bg-gray-200 rounded-full mb-4`} />
            <MyText style={tw`text-lg font-bold text-gray-900`}>
              Order #{selectedOrder?.readableId}
            </MyText>
            <MyText style={tw`text-sm text-gray-500`}>
              Select an action to perform
            </MyText>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm`}
            onPress={() => {
              router.push(`/order-details/${selectedOrder?.id}`);
                setShowOrderMenu(false);
              }}
              disabled={updateAddressCoordsMutation.isPending}
            >
            <View style={tw`w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-4`}>
              <MaterialIcons name="visibility" size={20} color="#9333ea" />
            </View>
            <View>
              <MyText style={tw`font-semibold text-gray-800 text-base`}>
                View Details
              </MyText>
              <MyText style={tw`text-gray-500 text-xs`}>
                See full order information
              </MyText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm ${updatePackagedMutation.isPending ? 'opacity-50' : ''}`}
            onPress={async () => {
              if (!selectedOrder) return;
              try {
                await updatePackagedMutation.mutateAsync({
                  orderId: selectedOrder.id.toString(),
                  isPackaged: !selectedOrder.isPackaged,
                });
                refetchOrders();
                refetchSequence();
                setShowOrderMenu(false);
              } catch (error) {
                Alert.alert('Error', 'Failed to update packaged status');
              }
            }}
            disabled={updatePackagedMutation.isPending}
          >
            <View style={tw`w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4`}>
              <MaterialIcons name="inventory" size={20} color="#2563eb" />
            </View>
            <View>
              <MyText style={tw`font-semibold text-gray-800 text-base`}>
                {selectedOrder?.isPackaged ? 'Unmark Packaged' : 'Mark Packaged'}
              </MyText>
              <MyText style={tw`text-gray-500 text-xs`}>
                {selectedOrder?.isPackaged ? 'Revert to not packaged' : 'Update status to packaged'}
              </MyText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm ${updateDeliveredMutation.isPending ? 'opacity-50' : ''}`}
            onPress={async () => {
              if (!selectedOrder) return;
              try {
                await updateDeliveredMutation.mutateAsync({
                  orderId: selectedOrder.id.toString(),
                  isDelivered: !selectedOrder.isDelivered,
                });
                refetchOrders();
                refetchSequence();
                setShowOrderMenu(false);
              } catch (error) {
                Alert.alert('Error', 'Failed to update delivered status');
              }
            }}
            disabled={updateDeliveredMutation.isPending}
          >
            <View style={tw`w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4`}>
              <MaterialIcons name="local-shipping" size={20} color="#16a34a" />
            </View>
            <View>
              <MyText style={tw`font-semibold text-gray-800 text-base`}>
                {selectedOrder?.isDelivered ? 'Unmark Delivered' : 'Mark Delivered'}
              </MyText>
              <MyText style={tw`text-gray-500 text-xs`}>
                {selectedOrder?.isDelivered ? 'Revert delivery status' : 'Complete the delivery'}
              </MyText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
          </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm ${updateAddressCoordsMutation.isPending ? 'opacity-50' : ''}`}
              onPress={async () => {
               if (!selectedOrder) return;
               try {
                 const { status } = await Location.requestForegroundPermissionsAsync();
                 if (status !== 'granted') {
                   Alert.alert('Permission Denied', 'Location permission is required to attach coordinates.');
                   return;
                 }
                 const location = await Location.getCurrentPositionAsync({
                   accuracy: Location.Accuracy.High,
                 });
                 const { latitude, longitude } = location.coords;
                  await updateAddressCoordsMutation.mutateAsync({
                    addressId: selectedOrder.addressId,
                    latitude,
                    longitude,
                  });
                 Alert.alert('Success', 'Location attached to address successfully.');
               } catch (error) {
                 Alert.alert('Error', 'Failed to attach location. Please try again.');
               }
               setShowOrderMenu(false);
             }}
           >
             <View style={tw`w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4`}>
               <MaterialIcons name="add-location-alt" size={20} color="#ea580c" />
             </View>
             <View>
               <MyText style={tw`font-semibold text-gray-800 text-base`}>
                 Attach Location
               </MyText>
               <MyText style={tw`text-gray-500 text-xs`}>
                 Save coordinates to address
               </MyText>
             </View>
             <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
           </TouchableOpacity>

           <TouchableOpacity
             style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm`}
             onPress={() => {
               const phoneMatch = selectedOrder?.address.match(/Phone: (\d+)/);
               const phone = phoneMatch ? phoneMatch[1] : null;
               if (phone) {
                 Linking.openURL(`whatsapp://send?phone=+91${phone}`);
               } else {
                 Alert.alert('No phone number found');
               }
               setShowOrderMenu(false);
             }}
           >
             <View style={tw`w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4`}>
               <MaterialIcons name="message" size={20} color="#16a34a" />
             </View>
             <View>
               <MyText style={tw`font-semibold text-gray-800 text-base`}>
                 Message On WhatsApp
               </MyText>
               <MyText style={tw`text-gray-500 text-xs`}>
                 Send message via WhatsApp
               </MyText>
             </View>
             <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
           </TouchableOpacity>

           <TouchableOpacity
             style={tw`flex-row items-center p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm`}
             onPress={() => {
               const phoneMatch = selectedOrder?.address.match(/Phone: (\d+)/);
               const phone = phoneMatch ? phoneMatch[1] : null;
               if (phone) {
                 Linking.openURL(`tel:${phone}`);
               } else {
                 Alert.alert('No phone number found');
               }
               setShowOrderMenu(false);
             }}
           >
             <View style={tw`w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4`}>
               <MaterialIcons name="phone" size={20} color="#16a34a" />
             </View>
             <View>
               <MyText style={tw`font-semibold text-gray-800 text-base`}>
                 Dial Mobile Number
               </MyText>
               <MyText style={tw`text-gray-500 text-xs`}>
                 Call customer directly
               </MyText>
             </View>
             <MaterialIcons name="chevron-right" size={24} color="#9ca3af" style={tw`ml-auto`} />
           </TouchableOpacity>
        </View>
      </BottomDialog>
    </View>
  );
}
