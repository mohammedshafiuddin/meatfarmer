import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { MyText, tw, BottomDialog } from 'common-ui';
import { SuccessToast } from '../services/toaster';

export interface SnippetMenuOption {
  title: string;
  icon: keyof typeof Entypo.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}

export interface SnippetMenuProps {
  snippet: {
    id: number;
    snippetCode: string;
    accessUrl: string;
  };
  onEdit: (snippet: any) => void;
  onDelete: (id: number) => void;
  onViewOrders: (snippetCode: string) => void;
  triggerStyle?: any;
  iconSize?: number;
  iconColor?: string;
}

export const SnippetMenu: React.FC<SnippetMenuProps> = ({
  snippet,
  onEdit,
  onDelete,
  onViewOrders,
  triggerStyle = tw`p-2 rounded-full bg-gray-50`,
  iconSize = 16,
  iconColor = '#6B7280',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenMenu = () => {
    setIsOpen(true);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleViewOrders = () => {
    setIsOpen(false);
    onViewOrders(snippet.snippetCode);
  };

  const handleEdit = () => {
    setIsOpen(false);
    onEdit(snippet);
  };

  const handleDelete = () => {
    setIsOpen(false);
    Alert.alert(
      'Delete Snippet',
      'Are you sure you want to delete this vendor snippet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(snippet.id),
        },
      ]
    );
  };

  const handleCopyUrl = async () => {
    setIsOpen(false);
    await Clipboard.setString(snippet.accessUrl);
    SuccessToast('URL copied to clipboard');
  };

  const options: SnippetMenuOption[] = [
    {
      title: 'View Orders',
      icon: 'eye',
      onPress: handleViewOrders,
    },
    {
      title: 'Edit',
      icon: 'edit',
      onPress: handleEdit,
    },
    {
      title: 'Copy URL',
      icon: 'link',
      onPress: handleCopyUrl,
    },
    {
      title: 'Delete',
      icon: 'trash',
      onPress: handleDelete,
    },
  ];

  const handleOptionPress = (option: SnippetMenuOption) => {
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
            Snippet Options
          </MyText>

          {options.map((option, index) => (
            <TouchableOpacity
              key={`${snippet.id}-${index}`}
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
    </>
  );
};