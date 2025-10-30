import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { AppContainer, MyText, tw } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';
import { useFocusCallback } from 'common-ui';

interface CouponCardProps {
  coupon: {
    id: number;
    code: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    maxValue?: number;
    minOrder?: number;
    description: string;
    validTill?: string | Date;
    usageCount: number;
    maxLimitForUser?: number;
    isExpired: boolean;
    isUsedUp: boolean;
  };
}

function CouponCard({ coupon }: CouponCardProps) {
  const getStatusColor = () => {
    if (coupon.isExpired) return 'text-red-500';
    if (coupon.isUsedUp) return 'text-orange-500';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (coupon.isExpired) return 'Expired';
    if (coupon.isUsedUp) return 'Used';
    return 'Available';
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'No expiry';
    return dayjs(date).format('DD MMM YYYY');
  };

  return (
    <View style={tw`bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100`}>
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <View style={tw`flex-1`}>
          <MyText weight="semibold" style={tw`text-lg text-gray-800 mb-1`}>
            {coupon.code}
          </MyText>
          <MyText style={tw`text-sm text-gray-600 mb-2`}>
            {coupon.description}
          </MyText>
        </View>
        <View style={tw`items-end`}>
          <MyText style={tw`${getStatusColor()} text-sm font-medium mb-1`}>
            {getStatusText()}
          </MyText>
          {coupon.maxLimitForUser && (
            <MyText style={tw`text-xs text-gray-500`}>
              Used: {coupon.usageCount}/{coupon.maxLimitForUser}
            </MyText>
          )}
        </View>
      </View>

      <View style={tw`flex-row justify-between items-center`}>
        <MyText style={tw`text-xs text-gray-500`}>
          Valid till: {formatDate(coupon.validTill)}
        </MyText>
        <TouchableOpacity
          style={tw`bg-blue-500 px-3 py-1 rounded-full`}
          disabled={coupon.isExpired || coupon.isUsedUp}
        >
          <MyText style={tw`text-white text-xs font-medium`}>
            {coupon.isExpired || coupon.isUsedUp ? 'Unavailable' : 'Apply'}
          </MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CouponSection({
  title,
  coupons,
  emptyMessage
}: {
  title: string;
  coupons: CouponCardProps['coupon'][];
  emptyMessage: string;
}) {
  return (
    <View style={tw`mb-6`}>
      <MyText weight="semibold" style={tw`text-lg text-gray-800 mb-3`}>
        {title}
      </MyText>

      {coupons.length === 0 ? (
        <View style={tw`bg-gray-50 rounded-lg p-6 items-center`}>
          <MaterialIcons name="local-offer" size={48} color="#9CA3AF" />
          <MyText style={tw`text-gray-500 text-center mt-2`}>
            {emptyMessage}
          </MyText>
        </View>
      ) : (
        coupons.map(coupon => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))
      )}
    </View>
  );
}

export default function Coupons() {
  const { data, isLoading, error, refetch } = trpc.user.coupon.getMyCoupons.useQuery();

  // Refetch coupons when screen comes into focus
  useFocusCallback(() => {
    refetch();
  });

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading coupons...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    console.log(error)
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <MyText style={tw`text-red-600 text-center mt-2`}>
            Failed to load coupons. Please try again.
          </MyText>
        </View>
      </AppContainer>
    );
  }

  const personalCoupons = data?.data?.personal || [];
  const generalCoupons = data?.data?.general || [];

  return (
    <AppContainer>
      <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
        <MyText weight="bold" style={tw`text-2xl text-gray-800 mb-2`}>
          My Coupons
        </MyText>
        <MyText style={tw`text-gray-600 mb-6`}>
          View and manage your available coupons
        </MyText>

        <CouponSection
          title="Only for Me"
          coupons={personalCoupons}
          emptyMessage="No personal coupons available"
        />

        <CouponSection
          title="Apply to All"
          coupons={generalCoupons}
          emptyMessage="No general coupons available"
        />
      </ScrollView>
    </AppContainer>
  );
}