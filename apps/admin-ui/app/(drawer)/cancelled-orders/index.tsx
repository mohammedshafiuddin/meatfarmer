import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { TabViewWrapper, AppContainer, MyText, tw, useManualRefresh, useMarkDataFetchers } from 'common-ui';
import { trpc } from '../../../src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OrderMenu } from '@/components/OrderMenu';

interface CancelledOrderItem {
  name: string;
  quantity: string;
  price: any;
  unit?: string;
  amount: number;
}

interface CancelledOrder {
  id: number;
  readableId?: number | string; 
  customerName: string;
  address: string;
  totalAmount: string;
  cancellationReviewed: boolean;
  isRefundDone: boolean;
  adminNotes?: string | null;
  cancelReason?: string | null;
  items: CancelledOrderItem[];
  createdAt: string;
}

const OrderItem = ({
  order,
  isReviewedTab,
  onToggleReview
}: {
  order: CancelledOrder;
  isReviewedTab: boolean;
  onToggleReview: (orderId: number, reviewed: boolean) => void;
}) => {
  const displayedItems = order.items.slice(0, 2);
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  const handleToggleReview = () => {
    const action = isReviewedTab ? 'mark as not reviewed' : 'mark as reviewed';
    Alert.alert(
      'Update Review Status',
      `Are you sure you want to ${action} order #${order.readableId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => onToggleReview(order.id, !isReviewedTab),
        },
      ]
    );
  };



  return (
    <View style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg`}>
      <MyText style={tw`font-bold text-gray-800 mb-2`}>{order.customerName} - #{order.readableId}</MyText>
      <View style={tw`flex-row gap-2 mb-2`}>
        <TouchableOpacity
          onPress={handleToggleReview}
          style={tw`bg-blue-500 px-3 py-2 rounded-lg`}
        >
          <MyText style={tw`text-white text-sm font-semibold`}>
            {isReviewedTab ? 'Mark not reviewed' : 'Mark Reviewed'}
          </MyText>
        </TouchableOpacity>
        <OrderMenu
          orderId={order.id}
          variant="cancelled"
        />
      </View>

      <MyText style={tw`text-gray-600 mb-1`} numberOfLines={1}>{order.address}</MyText>

      {order.cancelReason && (
        <MyText style={tw`text-red-600 mb-1 text-sm`}>
          Reason: {order.cancelReason}
        </MyText>
      )}

      <MyText style={tw`text-gray-700 mb-2`}>
        Items: {displayedItems.map(item => `${item.name} (${item.quantity}) - ₹${item.amount}`).join(', ')}{moreItems}
      </MyText>

      <MyText style={tw`text-gray-700 font-semibold`}>
        Total: ₹{order.totalAmount}
      </MyText>

      {order.adminNotes && (
        <View style={tw`mt-2 p-2 bg-gray-50 rounded-lg`}>
          <MyText style={tw`text-gray-600 text-sm`}>
            Notes: {order.adminNotes}
          </MyText>
        </View>
      )}
    </View>
  );
};

export default function CancelledOrders() {
  const [index, setIndex] = useState(0);
  const { data: cancelledOrders, isLoading, error, refetch } = trpc.admin.cancelledOrders.getAll.useQuery();
  const updateReviewMutation = trpc.admin.cancelledOrders.updateReview.useMutation();

  useManualRefresh(refetch);

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleToggleReview = (orderId: number, reviewed: boolean) => {
    updateReviewMutation.mutate({
      orderId,
      cancellationReviewed: reviewed,
    });
  };



  const notReviewedCount = (cancelledOrders || []).filter(order => !order.cancellationReviewed).length;
  const reviewedCount = (cancelledOrders || []).filter(order => order.cancellationReviewed).length;

  const routes = [
    { key: 'not_reviewed', title: `Not Reviewed (${notReviewedCount})` },
    { key: 'reviewed', title: `Reviewed (${reviewedCount})` },
  ];

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading cancelled orders...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading cancelled orders</MyText>
        </View>
      </AppContainer>
    );
  }

  const renderScene = ({ route }: any) => {
    const isReviewedTab = route.key === 'reviewed';
    const filteredOrders = (cancelledOrders || []).filter(order => {
      return route.key === 'not_reviewed' ? !order.cancellationReviewed : order.cancellationReviewed;
    });

    return (
      <View style={tw`flex-1 p-4`}>
        {filteredOrders.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <MaterialIcons name="cancel" size={48} color="#9CA3AF" />
            <MyText style={tw`text-gray-500 mt-4`}>No orders</MyText>
          </View>
        ) : (
          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            {filteredOrders.map(order => (
              <OrderItem
                key={order.id}
                order={order}
                isReviewedTab={isReviewedTab}
                onToggleReview={handleToggleReview}
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
        initialLayout={{ width: Dimensions.get('window').width }}
      />
    </AppContainer>
  );
}