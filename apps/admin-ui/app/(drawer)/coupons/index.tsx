import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { tw, AppContainer, BottomDialog, MyButton } from 'common-ui';
import useManualRefresh from 'common-ui/hooks/useManualRefresh';
import { useGetCoupons, useCreateCoupon, useDeleteCoupon, CreateCouponPayload, Coupon } from '../../../src/api-hooks/coupon.api';
import CouponForm from '../../../src/components/CouponForm';
import { trpc } from '@/src/trpc-client';

export default function Coupons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // const { data: coupons = [], isLoading, error, refetch } = useGetCoupons();
  const { data: coupons = [], isLoading, error, refetch } = trpc.admin.coupon.getAll.useQuery();

  const createCoupon = trpc.admin.coupon.create.useMutation();
  const deleteCoupon = trpc.admin.coupon.delete.useMutation();
  // const createCoupon = useCreateCoupon();
  // const deleteCoupon = useDeleteCoupon();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useManualRefresh(() => refetch());

  const handleCreateCoupon = (values: CreateCouponPayload) => {
    createCoupon.mutate(values, {
      onSuccess: () => {
        Alert.alert('Success', 'Coupon created successfully');
        setIsCreateDialogOpen(false);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create coupon');
      },
    });
  };

  const handleDeleteCoupon = (id: number) => {
    Alert.alert('Delete Coupon', 'Are you sure you want to delete this coupon?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCoupon.mutate({id}, {
            onSuccess: () => {
              Alert.alert('Success', 'Coupon deleted successfully');
            },
            onError: (error: any) => {
              Alert.alert('Error', error.message || 'Failed to delete coupon');
            },
          });
        },
      },
    ]);
  };

  const renderCoupon = ({ item }: { item: Coupon }) => (
    <View style={tw`bg-white p-4 mb-2 rounded-lg shadow`}>
      <Text style={tw`text-lg font-bold mb-2`}>Coupon #{item.id}</Text>
      <Text style={tw`text-base font-semibold mb-1 text-blue-600`}>Code: {item.couponCode}</Text>
      <Text style={tw`text-base mb-1`}>
        Discount: {item.discountPercent ? `${item.discountPercent}%` : item.flatDiscount ? `₹${item.flatDiscount}` : 'N/A'}
      </Text>
      <Text style={tw`text-base mb-1`}>Min Order: {item.minOrder ? `₹${item.minOrder}` : 'N/A'}</Text>
      <Text style={tw`text-base mb-1`}>Max Value: {item.maxValue ? `₹${item.maxValue}` : 'N/A'}</Text>
      <Text style={tw`text-base mb-1`}>Valid Till: {item.validTill ? new Date(item.validTill).toLocaleDateString() : 'N/A'}</Text>
       <Text style={tw`text-base mb-1`}>
         Target: {item.isApplyForAll ? 'All Users' : item.targetUser ? `User ${item.targetUser}` : 'All Users'}
         {item.productIds && item.productIds.length > 0 && ` • Products: ${item.productIds.length} selected`}
       </Text>
      <Text style={tw`text-base mb-1`}>Status: {item.isInvalidated ? 'Invalidated' : 'Active'}</Text>
      <View style={tw`flex-row mt-2`}>
        <TouchableOpacity
          onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}
          style={tw`bg-blue-500 p-2 rounded mr-2`}
        >
          <Text style={tw`text-white`}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteCoupon(item.id)}
          style={tw`bg-red-500 p-2 rounded`}
        >
          <Text style={tw`text-white`}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <AppContainer>
        <Text>Loading coupons...</Text>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <Text>Error loading coupons</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={tw`text-xl font-bold`}>Coupons</Text>
        <MyButton onPress={() => setIsCreateDialogOpen(true)}>
          Add Coupon
        </MyButton>
      </View>
      <FlatList
        data={coupons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCoupon}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-10`}>
            <Text style={tw`text-gray-500`}>No coupons found</Text>
          </View>
        }
      />
      <BottomDialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <CouponForm
          onSubmit={handleCreateCoupon}
          isLoading={createCoupon.isPending}
        />
      </BottomDialog>
    </AppContainer>
  );
}