import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MyText, MyButton } from 'common-ui';
import { trpc } from '../src/trpc-client';

interface OrderNotesFormProps {
  orderId: number;
  initialNotes?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderNotesForm: React.FC<OrderNotesFormProps> = ({
  orderId,
  initialNotes = '',
  onSuccess,
  onCancel,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const updateNotesMutation = trpc.admin.order.updateNotes.useMutation();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter some notes');
      return;
    }

    try {
      await updateNotesMutation.mutateAsync({
        orderId,
        adminNotes: notes.trim(),
      });
      Alert.alert('Success', 'Notes updated successfully');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to update notes');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <MyText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Add Order Notes
      </MyText>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          minHeight: 100,
          fontSize: 16,
          textAlignVertical: 'top',
        }}
        value={notes}
        onChangeText={setNotes}
        placeholder="Enter notes for this order..."
        multiline
        numberOfLines={4}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <MyButton
          textContent="Cancel"
          onPress={onCancel}
          fillColor="gray1"
          textColor="white1"
        />
        <MyButton
          textContent={updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
          onPress={handleSubmit}
          fillColor="blue1"
          textColor="white1"
          disabled={updateNotesMutation.isPending}
        />
      </View>
    </View>
  );
};