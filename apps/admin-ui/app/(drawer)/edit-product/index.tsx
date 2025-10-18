import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppContainer } from 'common-ui';
import ProductForm from '../../../src/components/ProductForm';
import { useGetProduct, useUpdateProduct } from '../../../src/api-hooks/product.api';

export default function EditProduct() {
  const { id } = useLocalSearchParams();
  const productId = Number(id);

  const { data: product, isLoading: isFetching } = useGetProduct(productId);
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const handleSubmit = (values: any) => {
    const payload = {
      name: values.name,
      shortDescription: values.shortDescription,
      longDescription: values.longDescription,
      unitId: parseInt(values.unitId),
      price: parseFloat(values.price),
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    updateProduct(
      { id: productId, formData },
      {
        onSuccess: (data) => {
          Alert.alert('Success', 'Product updated successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to update product');
        },
      }
    );
  };

  if (isFetching) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading product...</Text>
        </View>
      </AppContainer>
    );
  }

  if (!product) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Product not found</Text>
        </View>
      </AppContainer>
    );
  }

  const productData = product.product; // The API returns { product: Product }

  const initialValues = {
    name: productData.name,
    shortDescription: productData.shortDescription || '',
    longDescription: productData.longDescription || '',
    unitId: productData.unitId,
    price: productData.price.toString(),
    deals: [{ quantity: '', price: '' }], // TODO: Handle deals if they exist
  };

  return (
    <AppContainer>
      <ProductForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        existingImages={productData.images || []}
      />
    </AppContainer>
  );
}