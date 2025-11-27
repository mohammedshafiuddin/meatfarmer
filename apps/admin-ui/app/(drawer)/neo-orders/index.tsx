import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppContainer, MyText, tw, MyFlatList, BottomDialog, BottomDropdown, Checkbox } from 'common-ui';
import { trpc } from '../../../src/trpc-client';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Entypo } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

interface OrderType {
  id: number;
  readableId: number;
  customerName: string | null;
  address: string;
  totalAmount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    amount: number;
    unit: string;
  }[];
  createdAt: string;
  deliveryTime: string;
  status: 'pending' | 'delivered' | 'cancelled';
  isPackaged: boolean;
  isDelivered: boolean;
  isCod: boolean;
}

const OrderItem = ({ order }: { order: OrderType }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  const updatePackagedMutation = trpc.admin.order.updatePackaged.useMutation();
  const updateDeliveredMutation = trpc.admin.order.updateDelivered.useMutation();

  const handleOrderPress = () => {
    router.push(`/order-details/${order.id}` as any);
  };

  const handleMenuOption = () => {
    setMenuOpen(false);
    router.push(`/order-details/${order.id}` as any);
  };

  const handleMarkPackaged = (isPackaged: boolean) => {
    updatePackagedMutation.mutate(
      { orderId: order.id.toString(), isPackaged },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['admin.order.getAll']);
          setMenuOpen(false);
        },
      }
    );
  };

  const handleMarkDelivered = (isDelivered: boolean) => {
    updateDeliveredMutation.mutate(
      { orderId: order.id.toString(), isDelivered },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['admin.order.getAll']);
          setMenuOpen(false);
        },
      }
    );
  };

  return (
    <>
      <TouchableOpacity
        style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg`}
        onPress={handleOrderPress}
      >
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <MyText style={tw`font-bold text-gray-800`}>
            {order.customerName} - #{order.readableId}
          </MyText>
          <View style={tw`flex-row items-center`}>
            {order.status === 'cancelled' && (
              <View style={tw`bg-red-500 px-2 py-1 rounded-full mr-2`}>
                <MyText style={tw`text-white text-xs font-semibold`}>Cancelled</MyText>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              style={tw`p-2 rounded-full bg-gray-50`}
            >
              <Entypo name="dots-three-vertical" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      <MyText style={tw`text-gray-600 mb-1`}>
        Delivery: {order.deliveryTime}
      </MyText>
      <MyText style={tw`text-gray-700 mb-2`}>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity})`).join(', ')}{moreItems}
      </MyText>
        <MyText style={tw`text-gray-700 font-semibold`}>
          Total: ₹{order.totalAmount}
        </MyText>
      </TouchableOpacity>

      <BottomDialog open={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={tw`p-6`}>
          <MyText style={tw`text-lg font-bold text-gray-800 mb-6`}>
            Order Options
          </MyText>
          <TouchableOpacity
            style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg mb-3`}
            onPress={() => handleMarkPackaged(!order.isPackaged)}
          >
            <Entypo name="box" size={20} color="#6B7280" />
            <MyText style={tw`text-gray-800 font-medium ml-3`}>
              {order.isPackaged ? 'Mark Not Packaged' : 'Mark Packaged'}
            </MyText>
          </TouchableOpacity>
          {order.isPackaged && (
            <TouchableOpacity
              style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg mb-3`}
              onPress={() => handleMarkDelivered(!order.isDelivered)}
            >
              <Entypo name="location" size={20} color="#6B7280" />
              <MyText style={tw`text-gray-800 font-medium ml-3`}>
                {order.isDelivered ? 'Mark Not Delivered' : 'Mark Delivered'}
              </MyText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg`}
            onPress={handleMenuOption}
          >
            <Entypo name="info-with-circle" size={20} color="#6B7280" />
            <MyText style={tw`text-gray-800 font-medium ml-3`}>
              Order Details
            </MyText>
          </TouchableOpacity>
        </View>
      </BottomDialog>
    </>
  );
};

export default function NeoOrders() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [packagedFilter, setPackagedFilter] = useState<'all' | 'packaged' | 'not_packaged'>('all');
  const [packagedChecked, setPackagedChecked] = useState(false);
  const [notPackagedChecked, setNotPackagedChecked] = useState(false);
  const [deliveredFilter, setDeliveredFilter] = useState<'all' | 'delivered' | 'not_delivered'>('all');
  const [deliveredChecked, setDeliveredChecked] = useState(false);
  const [notDeliveredChecked, setNotDeliveredChecked] = useState(false);
  const [cancellationFilter, setCancellationFilter] = useState<'all' | 'cancelled' | 'not_cancelled'>('all');
  const [cancelledChecked, setCancelledChecked] = useState(false);
  const [notCancelledChecked, setNotCancelledChecked] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const { data: slotsData } = trpc.admin.slots.getAll.useQuery();
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = trpc.admin.order.getAll.useInfiniteQuery(
    { limit: 20, slotId: selectedSlot, packagedFilter, deliveredFilter, cancellationFilter },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const orders = data?.pages.flatMap(page => page.orders) || [];

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <MyText style={tw`text-gray-600`}>Loading orders...</MyText>
      </View>
    );
  }

  const slotOptions = slotsData?.slots?.map(slot => ({
    label: dayjs(slot.deliveryTime).format('ddd DD MMM, h:mm a'),
    value: slot.id,
  })) || [];

  return (
    <>
      <MyFlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderItem order={item} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={tw`flex-row justify-between items-center p-4 bg-white`}>
            <View style={tw`flex-1 mr-4`}>
              <BottomDropdown
                label="Select Slot"
                options={slotOptions}
                value={selectedSlot || ''}
                onValueChange={(val) => {
                  setSelectedSlot(val ? Number(val) : null);
                }}
                placeholder="All slots"
              />
            </View>
            <TouchableOpacity
              onPress={() => setFilterDialogOpen(true)}
              style={tw`p-2`}
            >
              <MaterialIcons name="filter-list" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={tw`py-4 items-center`}>
              <MyText style={tw`text-gray-600`}>Loading more...</MyText>
            </View>
          ) : null
        }
      />

      <BottomDialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
        <AppContainer>
          <View style={tw`mt-4`}>
            <MyText style={tw`text-lg font-semibold mb-2`}>Packaged Status</MyText>
            <View style={tw`flex-row items-center mb-2`}>
              <Checkbox
                checked={packagedChecked}
                onPress={() => {
                  const newValue = !packagedChecked;
                  setPackagedChecked(newValue);
                  if (newValue && notPackagedChecked) {
                    setPackagedFilter('all');
                  } else if (newValue) {
                    setPackagedFilter('packaged');
                  } else if (notPackagedChecked) {
                    setPackagedFilter('not_packaged');
                  } else {
                    setPackagedFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Packaged</MyText>
            </View>
            <View style={tw`flex-row items-center`}>
              <Checkbox
                checked={notPackagedChecked}
                onPress={() => {
                  const newValue = !notPackagedChecked;
                  setNotPackagedChecked(newValue);
                  if (packagedChecked && newValue) {
                    setPackagedFilter('all');
                  } else if (newValue) {
                    setPackagedFilter('not_packaged');
                  } else if (packagedChecked) {
                    setPackagedFilter('packaged');
                  } else {
                    setPackagedFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Not Packaged</MyText>
            </View>
          </View>
          <View style={tw`mt-6`}>
            <MyText style={tw`text-lg font-semibold mb-2`}>Delivered Status</MyText>
            <View style={tw`flex-row items-center mb-2`}>
              <Checkbox
                checked={deliveredChecked}
                onPress={() => {
                  const newValue = !deliveredChecked;
                  setDeliveredChecked(newValue);
                  if (newValue && notDeliveredChecked) {
                    setDeliveredFilter('all');
                  } else if (newValue) {
                    setDeliveredFilter('delivered');
                  } else if (notDeliveredChecked) {
                    setDeliveredFilter('not_delivered');
                  } else {
                    setDeliveredFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Delivered</MyText>
            </View>
            <View style={tw`flex-row items-center`}>
              <Checkbox
                checked={notDeliveredChecked}
                onPress={() => {
                  const newValue = !notDeliveredChecked;
                  setNotDeliveredChecked(newValue);
                  if (deliveredChecked && newValue) {
                    setDeliveredFilter('all');
                  } else if (newValue) {
                    setDeliveredFilter('not_delivered');
                  } else if (deliveredChecked) {
                    setDeliveredFilter('delivered');
                  } else {
                    setDeliveredFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Not Delivered</MyText>
            </View>
          </View>
          <View style={tw`mt-6`}>
            <MyText style={tw`text-lg font-semibold mb-2`}>Cancellation Status</MyText>
            <View style={tw`flex-row items-center mb-2`}>
              <Checkbox
                checked={cancelledChecked}
                onPress={() => {
                  const newValue = !cancelledChecked;
                  setCancelledChecked(newValue);
                  if (newValue && notCancelledChecked) {
                    setCancellationFilter('all');
                  } else if (newValue) {
                    setCancellationFilter('cancelled');
                  } else if (notCancelledChecked) {
                    setCancellationFilter('not_cancelled');
                  } else {
                    setCancellationFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Cancelled</MyText>
            </View>
            <View style={tw`flex-row items-center`}>
              <Checkbox
                checked={notCancelledChecked}
                onPress={() => {
                  const newValue = !notCancelledChecked;
                  setNotCancelledChecked(newValue);
                  if (cancelledChecked && newValue) {
                    setCancellationFilter('all');
                  } else if (newValue) {
                    setCancellationFilter('not_cancelled');
                  } else if (cancelledChecked) {
                    setCancellationFilter('cancelled');
                  } else {
                    setCancellationFilter('all');
                  }
                }}
              />
              <MyText style={tw`ml-2`}>Not Cancelled</MyText>
            </View>
          </View>
        </AppContainer>
      </BottomDialog>
    </>
  );
}