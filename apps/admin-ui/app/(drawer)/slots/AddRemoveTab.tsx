import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Slot } from 'common-ui/shared-types';
import dayjs from 'dayjs';
import { tw, BottomDialog } from 'common-ui';
import AddSlotForm from './AddSlotForm';
import { trpc } from '@/src/trpc-client';

export default function AddRemoveTab() {
  const { data, isLoading, error, refetch } = trpc.admin.slots.getAll.useQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const { mutate: deleteSlot, isPending: isDeleting } = trpc.admin.slots.deleteSlot.useMutation();

  return (
    <View style={tw`p-4`}>
      <TouchableOpacity
        onPress={() => {
          setEditingSlot(null);
          setIsDialogOpen(true);
        }}
        style={tw`bg-blue-500 p-3 rounded-lg items-center mb-6`}
      >
        <Text style={tw`text-white text-base font-bold`}>Add a new slot</Text>
      </TouchableOpacity>

      <Text style={tw`text-xl font-bold mb-4`}>Available Slots</Text>
      {isLoading ? (
        <Text style={tw`text-gray-600`}>Loading slots...</Text>
      ) : error ? (
        <Text style={tw`text-red-600`}>Error loading slots: {error.message}</Text>
      ) : (
        <FlatList
          data={data?.slots || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={tw`bg-gray-50 p-4 mb-2 rounded-lg border border-gray-300 flex-row justify-between items-center`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold`}>
                  Delivery: {dayjs(item.deliveryTime).format('ddd DD MMM, h a')}
                </Text>
                <Text style={tw`text-base font-semibold`}>
                  Freeze: {dayjs(item.freezeTime).format('ddd DD MMM, h a')}
                </Text>
              </View>
              <View style={tw`flex-row`}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingSlot(item);
                    setIsDialogOpen(true);
                  }}
                  style={tw`p-2`}
                >
                  <Ionicons name="pencil" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Slot',
                      'Are you sure you want to delete this slot?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            deleteSlot({id: item.id }, {
                              onSuccess: () => {
                                Alert.alert('Success', 'Slot deleted successfully!');
                                refetch();
                              },
                              onError: (error: any) => {
                                Alert.alert('Error', error.message || 'Failed to delete slot');
                              },
                            });
                          },
                        },
                      ]
                    );
                  }}
                  style={tw`p-2`}
                  disabled={isDeleting}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <AddSlotForm
          onSlotAdded={() => {
            refetch();
            setIsDialogOpen(false);
            setEditingSlot(null);
          }}
          initialDeliveryTime={editingSlot ? new Date(editingSlot.deliveryTime) : null}
          initialFreezeTime={editingSlot ? new Date(editingSlot.freezeTime) : null}
          initialIsActive={editingSlot?.isActive ?? true}
          slotId={editingSlot?.id}
        />
      </BottomDialog>
    </View>
  );
}