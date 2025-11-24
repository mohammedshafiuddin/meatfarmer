import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MyText, tw, BottomDialog, MyTextInput } from 'common-ui';
import { OrderNotesForm } from './OrderNotesForm';
import { FullOrderView } from './FullOrderView';
import { trpc } from '../src/trpc-client';

export interface MenuOption {
  title: string;
  icon: keyof typeof Entypo.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}

export interface OrderMenuProps {
  orderId: number;
  variant: 'packaging' | 'delivery' | 'cancelled';
  triggerStyle?: any;
  iconSize?: number;
  iconColor?: string;
}

export const OrderMenu: React.FC<OrderMenuProps> = ({
  orderId,
  variant,
  triggerStyle = tw`p-2 rounded-full bg-gray-50`,
  iconSize = 16,
  iconColor = '#6B7280',
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [fullOrderDialogOpen, setFullOrderDialogOpen] = useState(false);
  const [generateCouponDialogOpen, setGenerateCouponDialogOpen] = useState(false);
  const [initiateRefundDialogOpen, setInitiateRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<'percent' | 'amount'>('percent');
  const [refundValue, setRefundValue] = useState('100');

  const generateCouponMutation = trpc.admin.coupon.generateCancellationCoupon.useMutation({
    onSuccess: (coupon) => {
      Alert.alert(
        'Success',
        `Refund coupon generated successfully!\n\nCode: ${coupon.couponCode}\nValue: ₹${coupon.flatDiscount}\nExpires: ${coupon.validTill ? new Date(coupon.validTill).toLocaleDateString() : 'N/A'}`
      );
      setGenerateCouponDialogOpen(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to generate refund coupon');
    },
  });

  const initiateRefundMutation = trpc.admin.payments.initiateRefund.useMutation({
    onSuccess: (result) => {
      Alert.alert(
        'Success',
        `Refund initiated successfully!\n\nAmount: ₹${result.amount}\nStatus: ${result.status}`
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to initiate refund');
    },
  });

  const handleOpenMenu = () => {
    setIsOpen(true);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleAddNotes = () => {
    setIsOpen(false);
    setNotesDialogOpen(true);
  };

  const handleShowFullOrder = () => {
    setIsOpen(false);
    setFullOrderDialogOpen(true);
  };

  const handleViewDetails = () => {
    setIsOpen(false);
    setFullOrderDialogOpen(true);
  };

  const handleViewFullDetails = () => {
    setIsOpen(false);
    router.push(`/order-details/${orderId}`);
  };

  const handleGenerateCoupon = () => {
    setIsOpen(false);
    setGenerateCouponDialogOpen(true);
  };

  const handleConfirmGenerateCoupon = () => {
    const orderIdString = `ORD${orderId.toString().padStart(3, '0')}`;
    generateCouponMutation.mutate({ orderId: orderIdString });
  };

  const handleInitiateRefund = () => {
    setIsOpen(false);
    setRefundType('percent');
    setRefundValue('100');
    setInitiateRefundDialogOpen(true);
  };

  const handleConfirmInitiateRefund = () => {
    const value = parseFloat(refundValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid refund value');
      return;
    }

    const mutationData: any = {
      orderId: Number(orderId),
    };

    if (refundType === 'percent') {
      if (value > 100) {
        Alert.alert('Error', 'Refund percentage cannot exceed 100%');
        return;
      }
      mutationData.refundPercent = value;
    } else {
      mutationData.refundAmount = value;
    }

    initiateRefundMutation.mutate(mutationData);
    setInitiateRefundDialogOpen(false);
  };

  const getOptionsForVariant = (): MenuOption[] => {
    const baseOptions: MenuOption[] = [
      {
        title: 'Add Notes',
        icon: 'edit',
        onPress: handleAddNotes,
      },
      {
        title: 'View Full Details',
        icon: 'info-with-circle',
        onPress: handleViewFullDetails,
      },
    ];

    switch (variant) {
      case 'packaging':
        return [
          ...baseOptions,
          {
            title: 'Show full Order',
            icon: 'eye',
            onPress: handleShowFullOrder,
          },
        ];
      case 'cancelled':
        return [
          ...baseOptions,
          {
            title: 'Show full Order',
            icon: 'eye',
            onPress: handleShowFullOrder,
          },
          {
            title: 'Initiate Refund',
            icon: 'credit-card',
            onPress: handleInitiateRefund,
          },
          {
            title: 'Generate Refund Coupon',
            icon: 'ticket',
            onPress: handleGenerateCoupon,
          },
        ];
      case 'delivery':
        return [
          ...baseOptions,
          {
            title: 'View Details',
            icon: 'info',
            onPress: handleViewDetails,
          },
        ];
      default:
        return baseOptions;
    }
  };

  const options = getOptionsForVariant();

  const handleOptionPress = (option: MenuOption) => {
    if (option.disabled) return;
    option.onPress();
  };

  return (
    <>
      {/* Menu Trigger */}
      <TouchableOpacity
        onPress={handleOpenMenu}
        style={triggerStyle}
      >
        <Entypo name="dots-three-vertical" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      {/* Menu Dialog */}
      <BottomDialog open={isOpen} onClose={handleCloseMenu}>
        <View style={tw`p-6`}>
          <MyText style={tw`text-lg font-bold text-gray-800 mb-6`}>
            Order Options
          </MyText>

          {options.map((option, index) => (
            <TouchableOpacity
              key={`${orderId}-${index}`}
              style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg ${index < options.length - 1 ? 'mb-3' : ''} ${option.disabled ? 'opacity-50' : ''}`}
              onPress={() => handleOptionPress(option)}
              disabled={option.disabled}
            >
              <Entypo
                name={option.icon}
                size={20}
                color={option.disabled ? '#9CA3AF' : '#6B7280'}
              />
              <MyText style={tw`text-gray-800 font-medium ml-3 ${option.disabled ? 'text-gray-400' : ''}`}>
                {option.title}
              </MyText>
            </TouchableOpacity>
          ))}
        </View>
      </BottomDialog>

      {/* Notes Dialog */}
      <BottomDialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)}>
        <OrderNotesForm
          orderId={Number(orderId)}
          onSuccess={() => setNotesDialogOpen(false)}
          onCancel={() => setNotesDialogOpen(false)}
        />
      </BottomDialog>

      {/* Full Order Dialog */}
      <BottomDialog open={fullOrderDialogOpen} onClose={() => setFullOrderDialogOpen(false)}>
        <FullOrderView orderId={Number(orderId)} />
      </BottomDialog>

      {/* Generate Coupon Dialog */}
      <BottomDialog open={generateCouponDialogOpen} onClose={() => setGenerateCouponDialogOpen(false)}>
        <View style={tw`p-6`}>
          <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Generate Refund Coupon</MyText>
          <MyText style={tw`text-gray-600 mb-6`}>
            This will create a refund coupon for the customer equal to the order amount.
            The coupon will be valid for 30 days and can only be used once.
          </MyText>
          <MyText style={tw`text-sm text-amber-600 mb-6`}>
            Note: This only works for online payment orders. COD orders cannot generate refund coupons.
          </MyText>
          <View style={tw`flex-row space-x-4`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-500 p-3 rounded-lg items-center`}
              onPress={() => setGenerateCouponDialogOpen(false)}
            >
              <MyText style={tw`text-white font-medium`}>Cancel</MyText>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-green-500 p-3 rounded-lg items-center`}
              onPress={handleConfirmGenerateCoupon}
              disabled={generateCouponMutation.isPending}
            >
              <MyText style={tw`text-white font-medium`}>
                {generateCouponMutation.isPending ? 'Generating...' : 'Generate Refund Coupon'}
              </MyText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>

      {/* Initiate Refund Dialog */}
      <BottomDialog open={initiateRefundDialogOpen} onClose={() => setInitiateRefundDialogOpen(false)}>
        <View style={tw`p-6`}>
          <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Initiate Refund</MyText>
          <MyText style={tw`text-gray-600 mb-6`}>
            Choose the refund type and amount. The refund will be processed through Razorpay.
          </MyText>

          {/* Refund Type Selection */}
          <View style={tw`mb-6`}>
            <MyText style={tw`text-sm font-medium text-gray-700 mb-3`}>Refund Type:</MyText>
            <View style={tw`flex-row space-x-4`}>
              <TouchableOpacity
                style={tw`flex-1 flex-row items-center p-3 rounded-lg border ${refundType === 'percent' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                onPress={() => setRefundType('percent')}
              >
                <View style={tw`w-4 h-4 rounded-full border-2 ${refundType === 'percent' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                  {refundType === 'percent' && <View style={tw`w-2 h-2 rounded-full bg-white self-center mt-0.5`} />}
                </View>
                <MyText style={tw`ml-2 text-sm font-medium ${refundType === 'percent' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Percentage
                </MyText>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 flex-row items-center p-3 rounded-lg border ${refundType === 'amount' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                onPress={() => setRefundType('amount')}
              >
                <View style={tw`w-4 h-4 rounded-full border-2 ${refundType === 'amount' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                  {refundType === 'amount' && <View style={tw`w-2 h-2 rounded-full bg-white self-center mt-0.5`} />}
                </View>
                <MyText style={tw`ml-2 text-sm font-medium ${refundType === 'amount' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Fixed Amount
                </MyText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Refund Value Input */}
          <View style={tw`mb-6`}>
            <MyTextInput
              topLabel={`Refund ${refundType === 'percent' ? 'Percentage (%)' : 'Amount (₹)'}`}
              value={refundValue}
              onChangeText={setRefundValue}
              keyboardType="numeric"
              placeholder={refundType === 'percent' ? '100' : '0.00'}
            />
          </View>

          <MyText style={tw`text-sm text-amber-600 mb-6`}>
            Note: This only works for online payment orders. COD orders cannot be refunded through this system.
          </MyText>

          <View style={tw`flex-row space-x-4`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-500 p-3 rounded-lg items-center`}
              onPress={() => setInitiateRefundDialogOpen(false)}
            >
              <MyText style={tw`text-white font-medium`}>Cancel</MyText>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-red-500 p-3 rounded-lg items-center`}
              onPress={handleConfirmInitiateRefund}
              disabled={initiateRefundMutation.isPending}
            >
              <MyText style={tw`text-white font-medium`}>
                {initiateRefundMutation.isPending ? 'Processing...' : 'Initiate Refund'}
              </MyText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>
    </>
  );
};