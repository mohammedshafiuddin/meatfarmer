import React from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import StoreForm, { StoreFormData } from '@/components/StoreForm';
import { trpc } from '@/src/trpc-client';

export default function AddStore() {
  const router = useRouter();

  const createStoreMutation = trpc.admin.store.createStore.useMutation();

  const handleSubmit = (values: StoreFormData) => {
    createStoreMutation.mutate(values, {
      onSuccess: (data) => {
        Alert.alert('Success', data.message);
        router.push('/(drawer)/stores' as any); // Navigate back to stores list
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create store');
      },
    });
  };

  return (
    <AppContainer>
      <View>
        <MyText style={tw`text-2xl font-bold text-gray-800 mb-6`}>Add New Store</MyText>
          <StoreForm
            mode="create"
            initialValues={{ name: '', description: '', owner: 0 }}
            onSubmit={handleSubmit}
            isLoading={createStoreMutation.isPending}
          />
      </View>
    </AppContainer>
  );
}