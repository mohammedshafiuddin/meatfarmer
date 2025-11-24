import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tw, MyButton, MyText, SearchBar, MyFlatList, useMarkDataFetchers } from 'common-ui';
import useManualRefresh from 'common-ui/hooks/useManualRefresh';
import { Coupon } from 'common-ui/shared-types';
import { trpc } from '@/src/trpc-client';
import { useRouter } from 'expo-router';

export default function Coupons() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // const { data: coupons = [], isLoading, error, refetch } = useGetCoupons();
  const { data: coupons = [], isLoading, error, refetch } = trpc.admin.coupon.getAll.useQuery();

  const filteredCoupons = useMemo(() => {
    if (!searchQuery) return coupons;
    return coupons.filter(coupon =>
      coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coupons, searchQuery]);

  const deleteCoupon = trpc.admin.coupon.delete.useMutation();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useManualRefresh(() => refetch());

  useMarkDataFetchers(() => {
    refetch();
  });

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
    <View style={tw`bg-white p-4 mb-4 rounded-2xl shadow-lg border-l-4 ${item.isInvalidated ? 'border-red-500' : 'border-green-500'}`}>
      <View style={tw`flex-row items-center mb-3`}>
        <View style={tw`w-10 h-10 rounded-full ${item.isInvalidated ? 'bg-red-100' : 'bg-green-100'} items-center justify-center mr-3`}>
          <MaterialCommunityIcons
            name={item.discountPercent ? "percent" : "currency-inr"}
            size={20}
            color={item.isInvalidated ? "#ef4444" : "#10b981"}
          />
        </View>
        <View style={tw`flex-1`}>
          <MyText style={tw`text-lg font-bold text-gray-800`}>{item.couponCode}</MyText>
          <MyText style={tw`text-sm text-gray-500`}>ID: {item.id}</MyText>
        </View>
        <View style={tw`px-2 py-1 rounded-full ${item.isInvalidated ? 'bg-red-100' : 'bg-green-100'}`}>
          <MyText style={tw`text-xs font-semibold ${item.isInvalidated ? 'text-red-600' : 'text-green-600'}`}>
            {item.isInvalidated ? 'Inactive' : 'Active'}
          </MyText>
        </View>
      </View>

      <View style={tw`bg-gray-50 p-3 rounded-lg mb-3`}>
        <MyText style={tw`text-base font-semibold mb-1 text-gray-800`}>
          Discount: {item.discountPercent ? `${item.discountPercent}% off` : item.flatDiscount ? `₹${item.flatDiscount} off` : 'N/A'}
        </MyText>
        <View style={tw`flex-row justify-between`}>
          <MyText style={tw`text-sm text-gray-600`}>Min Order: {item.minOrder ? `₹${item.minOrder}` : 'None'}</MyText>
          <MyText style={tw`text-sm text-gray-600`}>Max: {item.maxValue ? `₹${item.maxValue}` : 'None'}</MyText>
        </View>
        <MyText style={tw`text-sm text-gray-600 mt-1`}>
          Valid Till: {item.validTill ? new Date(item.validTill).toLocaleDateString() : 'No expiry'}
        </MyText>
      </View>

      <View style={tw`mb-3`}>
        <MyText style={tw`text-sm text-gray-700 mb-1`}>
          <MaterialCommunityIcons name="account-group" size={14} color="#6b7280" /> Target: {item.isApplyForAll ? 'All Users' : item.targetUser ? `${item.targetUser.name || 'User'} (${item.targetUser.mobile})` : 'All Users'}
        </MyText>
        {item.productIds && item.productIds.length > 0 && (
          <MyText style={tw`text-sm text-gray-700`}>
            <MaterialCommunityIcons name="package-variant" size={14} color="#6b7280" /> Products: {item.productIds.length} selected
          </MyText>
        )}
      </View>

      <View style={tw`flex-row mt-3 gap-2`}>
        <TouchableOpacity
          onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}
          style={tw`bg-blue-500 p-3 rounded-lg shadow-md flex-1 flex-row items-center justify-center`}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="white" />
          <MyText style={tw`text-white text-center font-semibold ml-1`}>Edit</MyText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteCoupon(item.id)}
          style={tw`bg-red-500 p-3 rounded-lg shadow-md flex-1 flex-row items-center justify-center`}
        >
          <MaterialCommunityIcons name="delete" size={16} color="white" />
          <MyText style={tw`text-white text-center font-semibold ml-1`}>Delete</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );

    if (isLoading) {
      return (
        <View style={tw`flex-1 justify-center items-center bg-white`}>
          <View style={tw`w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4`}>
            <MaterialCommunityIcons name="loading" size={32} color="#3b82f6" />
          </View>
          <MyText style={tw`text-lg font-semibold text-gray-600`}>Loading Coupons...</MyText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={tw`flex-1 justify-center items-center bg-white`}>
          <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
            <MaterialCommunityIcons name="alert-circle" size={32} color="#ef4444" />
          </View>
          <MyText style={tw`text-lg font-semibold text-red-600 mb-2`}>Oops!</MyText>
          <MyText style={tw`text-gray-600 text-center mb-4`}>Failed to load coupons. Please try again.</MyText>
          <MyButton onPress={() => refetch()} style={tw`bg-red-500`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="refresh" size={16} color="white" />
              <MyText style={tw`text-white font-semibold ml-1`}>Retry</MyText>
            </View>
          </MyButton>
        </View>
      );
    }

  return (
    <View style={tw`flex-1 bg-white`}>
       <View style={tw`flex-row items-center mb-4 p-4`}>
         <View style={tw`flex-1 mr-2`}>
           <SearchBar
             value={searchQuery}
             onChangeText={setSearchQuery}
             onSearch={() => {}}
             placeholder="Search coupons..."
           />
         </View>
          <MyButton onPress={() => router.push('/(drawer)/create-coupon')}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="plus" size={16} color="white" />
              <MyText style={tw`text-white font-semibold ml-1`}>Add</MyText>
            </View>
          </MyButton>
       </View>
        <MyFlatList
         data={filteredCoupons}
         keyExtractor={(item) => item.id.toString()}
         renderItem={renderCoupon}
         refreshControl={
           <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
         }
         contentContainerStyle={tw`px-4 pb-4`}
         ListEmptyComponent={
           searchQuery ? (
             <View style={tw`flex-1 justify-center items-center py-20`}>
               <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}>
                 <MaterialCommunityIcons name="magnify" size={40} color="#9ca3af" />
               </View>
               <MyText style={tw`text-xl font-semibold text-gray-600 mb-2`}>No Results</MyText>
               <MyText style={tw`text-gray-500 text-center mb-4`}>No coupons match "{searchQuery}"</MyText>
               <MyButton onPress={() => setSearchQuery('')} style={tw`bg-gray-500`}>
                 <MyText style={tw`text-white font-semibold`}>Clear Search</MyText>
               </MyButton>
             </View>
           ) : (
             <View style={tw`flex-1 justify-center items-center py-20`}>
               <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}>
                 <MaterialCommunityIcons name="ticket-percent-outline" size={40} color="#9ca3af" />
               </View>
               <MyText style={tw`text-xl font-semibold text-gray-600 mb-2`}>No Coupons Yet</MyText>
               <MyText style={tw`text-gray-500 text-center mb-4`}>Create your first coupon to start offering discounts</MyText>
                <MyButton onPress={() => router.push('/(drawer)/create-coupon')} style={tw`bg-blue-500`}>
                  <View style={tw`flex-row items-center`}>
                    <MaterialCommunityIcons name="plus" size={16} color="white" />
                    <MyText style={tw`text-white font-semibold ml-1`}>Create Coupon</MyText>
                  </View>
                </MyButton>
             </View>
           )
         }
        />
     </View>
  );
}