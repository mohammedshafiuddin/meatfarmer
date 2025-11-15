import React from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import StoreForm from '@/components/StoreForm';
import { trpc } from '@/src/trpc-client';

export default function EditStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const storeId = parseInt(id as string);

  const { data: storeData, isLoading: isLoadingStore } = trpc.admin.store.getStoreById.useQuery(
    { id: storeId },
    { enabled: !!storeId }
  );

  const updateStoreMutation = trpc.admin.store.updateStore.useMutation();

  const handleSubmit = (values: any) => {
    updateStoreMutation.mutate({ id: storeId, ...values }, {
      onSuccess: (data) => {
        Alert.alert('Success', data.message);
        router.push('/(drawer)/stores' as any);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to update store');
      },
    });
  };

  if (isLoadingStore) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText>Loading store...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (!storeData?.store) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText>Store not found</MyText>
        </View>
      </AppContainer>
    );
  }

  const initialValues = {
    name: storeData.store.name,
    description: storeData.store.description || '',
    owner: storeData.store.owner.id,
  };

  return (
    <AppContainer>
      <View>
        <MyText style={tw`text-2xl font-bold text-gray-800 mb-6`}>Edit Store</MyText>
          <StoreForm
            mode="edit"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            isLoading={updateStoreMutation.isPending}
          />
      </View>
    </AppContainer>
  );
}