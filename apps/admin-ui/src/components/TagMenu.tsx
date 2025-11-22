import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { MyText, tw, BottomDialog } from 'common-ui';
import { useRouter } from 'expo-router';
import { useDeleteTag } from '../api-hooks/tag.api';

export interface TagMenuProps {
  tagId: number;
  onDeleteSuccess?: () => void;
  triggerStyle?: any;
  iconSize?: number;
  iconColor?: string;
}

export const TagMenu: React.FC<TagMenuProps> = ({
  tagId,
  onDeleteSuccess,
  triggerStyle = tw`p-2 rounded-full bg-gray-50`,
  iconSize = 16,
  iconColor = '#6B7280',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { mutate: deleteTag, isPending: isDeleting } = useDeleteTag();

  const handleOpenMenu = () => {
    setIsOpen(true);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleEditTag = () => {
    setIsOpen(false);
    router.push(`/(drawer)/edit-tag?tagId=${tagId}`);
  };

  const handleDeleteTag = () => {
    setIsOpen(false);
    Alert.alert(
      'Delete Tag',
      'Are you sure you want to delete this tag? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(),
        }
      ]
    );
  };

  const performDelete = () => {
    deleteTag(tagId, {
      onSuccess: () => {
        Alert.alert('Success', 'Tag deleted successfully');
        onDeleteSuccess?.();
      },
      onError: (error: any) => {
        const errorMessage = error.message || 'Failed to delete tag';
        Alert.alert('Error', errorMessage);
      },
    });
  };

  const options = [
    {
      title: 'Edit Tag',
      icon: 'edit' as keyof typeof Entypo.glyphMap,
      onPress: handleEditTag,
    },
    {
      title: 'Delete Tag',
      icon: 'trash' as keyof typeof Entypo.glyphMap,
      onPress: handleDeleteTag,
    },
  ];

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
            Tag Options
          </MyText>

          {options.map((option, index) => (
            <TouchableOpacity
              key={`${tagId}-${index}`}
              style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg ${index < options.length - 1 ? 'mb-3' : ''}`}
              onPress={option.onPress}
            >
              <Entypo
                name={option.icon}
                size={20}
                color="#6B7280"
              />
              <MyText style={tw`text-gray-800 font-medium ml-3`}>
                {option.title}
              </MyText>
            </TouchableOpacity>
          ))}
        </View>
      </BottomDialog>
    </>
  );
};