import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { MyText, tw, BottomDialog } from 'common-ui';
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
  orderId: string | number;
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
  const [isOpen, setIsOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [fullOrderDialogOpen, setFullOrderDialogOpen] = useState(false);
  const [generateCouponDialogOpen, setGenerateCouponDialogOpen] = useState(false);

  const generateCouponMutation = trpc.admin.coupon.generateCancellationCoupon.useMutation({
    onSuccess: (coupon) => {
      Alert.alert(
        'Success',
        `Coupon generated successfully!\n\nCode: ${coupon.couponCode}\nValue: ₹${coupon.flatDiscount}\nExpires: ${coupon.validTill ? new Date(coupon.validTill).toLocaleDateString() : 'N/A'}`
      );
      setGenerateCouponDialogOpen(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to generate coupon');
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

  const handleGenerateCoupon = () => {
    setIsOpen(false);
    setGenerateCouponDialogOpen(true);
  };

  const handleConfirmGenerateCoupon = () => {
    const orderIdString = `ORD${orderId.toString().padStart(3, '0')}`;
    generateCouponMutation.mutate({ orderId: orderIdString });
  };

  const getOptionsForVariant = (): MenuOption[] => {
    const baseOptions: MenuOption[] = [
      {
        title: 'Add Notes',
        icon: 'edit',
        onPress: handleAddNotes,
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
            title: 'Generate Coupon',
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
          <MyText style={tw`text-xl font-bold text-gray-800 mb-4`}>Generate Cancellation Coupon</MyText>
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
                {generateCouponMutation.isPending ? 'Generating...' : 'Generate Coupon'}
              </MyText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>
    </>
  );
};