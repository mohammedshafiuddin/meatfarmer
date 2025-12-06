import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from "@tanstack/react-query";
import { MyText, ImageUploader, tw } from 'common-ui';
import usePickImage from 'common-ui/src/components/use-pick-image';
import axios from '../services/axios-user-ui';
// import axios from 'common-ui/src/services/axios';

interface ComplaintFormProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
}

export default function ComplaintForm({ open, onClose, orderId }: ComplaintFormProps) {
  const [complaintBody, setComplaintBody] = useState('');
  const [complaintImages, setComplaintImages] = useState<{ uri?: string }[]>([]);

  // API function
  const raiseComplaintApi = async (payload: { complaintBody: string; images: { uri?: string }[] }) => {
    const formData = new FormData();

    formData.append('orderId', orderId);
    formData.append('complaintBody', payload.complaintBody);

    // Add images if provided
    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((image, index) => {
        if (image.uri) {
          const fileName = `complaint-image-${index}.jpg`;
          formData.append('images', {
            uri: image.uri,
            name: fileName,
            type: 'image/jpeg',
          } as any);
        }
      });
    }

    const response = await axios.post('/uv/complaints/raise', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  // Hook
  const raiseComplaintMutation = useMutation({
    mutationFn: raiseComplaintApi,
  });

  const pickComplaintImage = usePickImage({
    setFile: (files) => setComplaintImages(prev => [...prev, ...files]),
    multiple: true,
  });

  const handleSubmit = () => {
    if (!complaintBody.trim()) {
      Alert.alert('Error', 'Please enter complaint details');
      return;
    }

    raiseComplaintMutation.mutate(
      {
        complaintBody: complaintBody.trim(),
        images: complaintImages,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Complaint raised successfully');
          setComplaintBody('');
          setComplaintImages([]);
          onClose();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to raise complaint');
        },
      }
    );
  };

  if (!open) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={tw`p-6`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <MyText style={tw`text-xl font-bold text-gray-900`}>Raise Complaint</MyText>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <MyText style={tw`text-gray-700 font-medium mb-2`}>Describe the issue</MyText>
        <TextInput
          style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-32 text-base text-gray-800 mb-4`}
          value={complaintBody}
          onChangeText={setComplaintBody}
          placeholder="Tell us what went wrong..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <ImageUploader
          images={complaintImages}
          onAddImage={pickComplaintImage}
          onRemoveImage={(uri) => setComplaintImages(prev => prev.filter(img => img.uri !== uri))}
        />

        <TouchableOpacity
          style={tw`bg-yellow-500 py-4 rounded-xl shadow-sm items-center mt-4 ${raiseComplaintMutation.isPending ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={raiseComplaintMutation.isPending}
        >
          {raiseComplaintMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <MyText style={tw`text-white font-bold text-lg`}>Submit Complaint</MyText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}