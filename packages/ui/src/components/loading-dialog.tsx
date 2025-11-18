import React from 'react';
import { View, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import tw from '../lib/tailwind';
import MyText from './text';

interface LoadingDialogProps {
  open: boolean;
  message?: string;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  open,
  message = 'Loading...'
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Non-dismissible loading dialog
    >
      <TouchableOpacity
        style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}
        activeOpacity={1}
        onPress={() => {}} // Prevent dismissal
      >
        <View style={tw`bg-white rounded-xl p-8 items-center justify-center min-w-50 min-h-37.5 shadow-lg`}>
          <ActivityIndicator size="large" color="#3B82F6" style={tw`mb-4`} />
          <MyText style={tw`text-base text-gray-500 text-center`}>{message}</MyText>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default LoadingDialog;