import React from 'react';
import { View, Alert } from 'react-native';
import { tw, AppContainer } from 'common-ui';
import CouponForm from '../../../src/components/CouponForm';
import { trpc } from '@/src/trpc-client';
import { useRouter } from 'expo-router';

export default function CreateCoupon() {
  const router = useRouter();
  const createCoupon = trpc.admin.coupon.create.useMutation();

  const handleCreateCoupon = (values: any) => {
    // Transform targetUsers array to targetUser for backend compatibility
    const payload = {
      ...values,
      targetUser: values.targetUsers?.[0] || undefined,
    };
    delete payload.targetUsers;

    createCoupon.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Coupon created successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create coupon');
      },
    });
  };

  return (
    <AppContainer>
      <CouponForm
        onSubmit={handleCreateCoupon}
        isLoading={createCoupon.isPending}
      />
    </AppContainer>
  );
}