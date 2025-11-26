import React from 'react';
import { View, Alert } from 'react-native';
import { tw, AppContainer, MyText } from 'common-ui';
import CouponForm from '../../../../src/components/CouponForm';
import { trpc } from '@/src/trpc-client';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { CreateCouponPayload } from 'common-ui/shared-types';

export default function EditCoupon() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const couponId = parseInt(id as string);

  const { data: coupon, isLoading } = trpc.admin.coupon.getById.useQuery({ id: couponId });
  const updateCoupon = trpc.admin.coupon.update.useMutation();

  const handleUpdateCoupon = (values: CreateCouponPayload) => {
    // Transform targetUsers array to targetUser for backend compatibility
    const updates = {
      ...values,
      targetUser: values.targetUsers?.[0] || undefined,
    };
    delete updates.targetUsers;

    updateCoupon.mutate({ id: couponId, updates }, {
      onSuccess: () => {
        Alert.alert('Success', 'Coupon updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to update coupon');
      },
    });
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText>Loading...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (!coupon) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText>Coupon not found</MyText>
        </View>
      </AppContainer>
    );
  }

  // Transform coupon data for form (targetUser to targetUsers array)
  const initialValues: Partial<CreateCouponPayload> = {
    couponCode: coupon.couponCode,
    isUserBased: coupon.isUserBased,
    isApplyForAll: coupon.isApplyForAll,
    targetUsers: coupon.targetUser ? [coupon.targetUser.id] : [],
    discountPercent: coupon.discountPercent ? parseFloat(coupon.discountPercent) : undefined,
    flatDiscount: coupon.flatDiscount ? parseFloat(coupon.flatDiscount) : undefined,
    minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
    maxValue: coupon.maxValue ? parseFloat(coupon.maxValue) : undefined,
    validTill: coupon.validTill ? dayjs(coupon.validTill).format('YYYY-MM-DD') : undefined,
    maxLimitForUser: coupon.maxLimitForUser || undefined,
    productIds: coupon.productIds,
  };

  return (
    <AppContainer>
      <CouponForm
        initialValues={initialValues}
        onSubmit={handleUpdateCoupon}
        isLoading={updateCoupon.isPending}
      />
    </AppContainer>
  );
}