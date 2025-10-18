import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { MyText , tw } from "common-ui";
import { Ionicons } from '@expo/vector-icons';

interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  title, 
  subtitle, 
  icon, 
  iconColor, 
  bgColor,
  onPress,
  style
}) => {
  return (
    <TouchableOpacity 
      style={[tw`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 items-center`, style]}
      onPress={onPress}
    >
      <View style={[tw`w-14 h-14 rounded-full items-center justify-center mb-3`, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <MyText style={tw`font-semibold text-center text-gray-800 dark:text-white`}>{title}</MyText>
      <MyText style={tw`text-xs text-gray-500 dark:text-gray-400 mt-1 text-center`}>{subtitle}</MyText>
    </TouchableOpacity>
  );
};

export default QuickActionButton;