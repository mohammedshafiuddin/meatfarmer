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
  orderId: string;
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
  couponCode?: string;
  couponDescription?: string;
  discountAmount?: number;
}

const OrderItem = ({ order }: { order: OrderType }) => {
  const id = order.orderId;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updatePackagedMutation = trpc.admin.order.updatePackaged.useMutation();
  const updateDeliveredMutation = trpc.admin.order.updateDelivered.useMutation();
  const queryClient = useQueryClient();

  const handleOrderPress = () => {
    router.push(`/order-details/${order.orderId}` as any);
  };

  const handleMenuOption = () => {
    setMenuOpen(false);
    router.push(`/order-details/${order.orderId}` as any);
  };

  const handleMarkPackaged = (isPackaged: boolean) => {
    updatePackagedMutation.mutate(
      { orderId: order.orderId.toString(), isPackaged },
      {
        onSuccess: () => {
          setMenuOpen(false);
          // queryClient.invalidateQueries({ queryKey: trpc.admin.order.getAll.getQueryKey() });
        },
      }
    );
  };

  const handleMarkDelivered = (isDelivered: boolean) => {
    updateDeliveredMutation.mutate(
      { orderId: order.orderId.toString(), isDelivered },
      {
        onSuccess: () => {
          setMenuOpen(false); 
          // queryClient.invalidateQueries({ queryKey: trpc.admin.order.getAl });
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <TouchableOpacity
        style={tw`bg-white mx-4 mb-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
        onPress={handleOrderPress}
        activeOpacity={0.9}
      >
        {/* Header Section */}
        <View style={tw`p-4 border-b border-gray-100 bg-gray-50/50`}>
          <View style={tw`flex-row justify-between items-start`}>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center mb-1`}>
                <MyText style={tw`font-bold text-lg text-gray-900 mr-2`}>
                  {order.customerName || 'Unknown Customer'}
                </MyText>
                <View style={tw`bg-gray-200 px-2 py-0.5 rounded`}>
                  <MyText style={tw`text-xs font-medium text-gray-600`}>#{order.readableId}</MyText>
                </View>
              </View>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="access-time" size={12} color="#6B7280" />
                <MyText style={tw`text-xs text-gray-500 ml-1`}>
                  {dayjs(order.createdAt).format('MMM D, h:mm A')}
                </MyText>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              style={tw`p-2 -mr-2 -mt-2 rounded-full`}
            >
              <Entypo name="dots-three-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={tw`p-4`}>
          {/* Status Badges */}
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            <View style={tw`px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
              <MyText style={tw`text-xs font-semibold capitalize`}>{order.status}</MyText>
            </View>
            {order.isCod && (
              <View style={tw`px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100`}>
                <MyText style={tw`text-xs font-semibold text-blue-700`}>COD</MyText>
              </View>
            )}
            <View style={tw`px-2.5 py-1 rounded-full ${order.isPackaged ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <MyText style={tw`text-xs font-semibold ${order.isPackaged ? 'text-purple-700' : 'text-gray-600'}`}>
                {order.isPackaged ? 'Packaged' : 'Not Packaged'}
              </MyText>
            </View>
            <View style={tw`px-2.5 py-1 rounded-full ${order.isDelivered ? 'bg-green-100' : 'bg-gray-100'}`}>
              <MyText style={tw`text-xs font-semibold ${order.isDelivered ? 'text-green-700' : 'text-gray-600'}`}>
                {order.isDelivered ? 'Delivered' : 'Not Delivered'}
              </MyText>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={tw`flex-row items-start mb-4 bg-blue-50/50 p-3 rounded-lg`}>
            <MaterialIcons name="location-pin" size={18} color="#3B82F6" style={tw`mt-0.5`} />
            <View style={tw`ml-2 flex-1`}>
              <MyText style={tw`text-xs font-bold text-blue-800 mb-0.5 uppercase tracking-wide`}>Delivery Address</MyText>
              <MyText style={tw`text-sm text-gray-700 leading-5`} numberOfLines={2}>
                {order.address}
              </MyText>
              <View style={tw`flex-row items-center mt-2`}>
                <MaterialIcons name="event" size={14} color="#6B7280" />
                <MyText style={tw`text-xs text-gray-600 ml-1`}>
                  Slot: {order.deliveryTime}
                </MyText>
              </View>
            </View>
          </View>

          {/* Items List */}
          <View style={tw`mb-4`}>
            <MyText style={tw`text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide`}>Order Items</MyText>
            {order.items.slice(0, expanded ? undefined : 3).map((item, idx) => (
              <View key={idx} style={tw`flex-row justify-between items-center py-1.5 border-b border-gray-50 last:border-0`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`bg-gray-100 px-2 py-1 rounded items-center justify-center mr-2`}>
                    <MyText style={tw`text-xs font-bold text-gray-600`}>{item.quantity} {item.unit}</MyText>
                  </View>
                  <MyText style={tw`text-sm text-gray-800 flex-1`} numberOfLines={1}>{item.name}</MyText>
                </View>
                <MyText style={tw`text-sm font-medium text-gray-900`}>₹{item.amount}</MyText>
              </View>
            ))}

            {order.items.length > 3 && (
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={tw`mt-2 flex-row items-center justify-center py-1`}
              >
                <MyText style={tw`text-xs font-bold text-blue-600`}>
                  {expanded ? 'Show Less' : `+ ${order.items.length - 3} More Items`}
                </MyText>
              </TouchableOpacity>
            )}
           </View>

           {/* Coupons */}
           {order.couponCode && (
             <View style={tw`mb-4`}>
               <MyText style={tw`text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide`}>Applied Coupons</MyText>
               <View style={tw`bg-pink-50 border border-pink-200 rounded-lg p-3`}>
                 <MyText style={tw`text-sm text-pink-800 font-medium mb-1`}>
                   {order.couponCode}
                 </MyText>
                 {order.couponDescription && (
                   <MyText style={tw`text-xs text-pink-600 mb-2`}>
                     {order.couponDescription}
                   </MyText>
                 )}
                 {order.discountAmount && (
                   <MyText style={tw`text-sm font-bold text-pink-800`}>
                     Discount: ₹{order.discountAmount}
                   </MyText>
                 )}
               </View>
             </View>
           )}

           {/* Footer / Total */}
          <View style={tw`pt-3 border-t border-gray-100 flex-row justify-between items-center`}>
            <MyText style={tw`text-sm text-gray-500`}>Total Amount</MyText>
            <MyText style={tw`text-xl font-bold text-gray-900`}>₹{order.totalAmount}</MyText>
          </View>
        </View>
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

export default function Orders() {
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
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } = trpc.admin.order.getAll.useInfiniteQuery(
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
        keyExtractor={(item) => item.orderId}
        renderItem={({ item }) => <OrderItem order={item} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        onRefresh={() => refetch()}
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