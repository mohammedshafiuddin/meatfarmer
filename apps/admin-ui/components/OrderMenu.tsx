import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { MyText, tw, BottomDialog } from 'common-ui';
import { OrderNotesForm } from './OrderNotesForm';
import { FullOrderView } from './FullOrderView';

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
    // TODO: Implement view details functionality
    console.log('View details for order:', orderId);
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
      case 'cancelled':
        return [
          ...baseOptions,
          {
            title: 'Show full Order',
            icon: 'eye',
            onPress: handleShowFullOrder,
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
    </>
  );
};