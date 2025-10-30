import React from 'react';
import { Alert } from 'react-native';
import { AppContainer } from 'common-ui';
import ProductForm from '../../../src/components/ProductForm';
import { useCreateProduct, CreateProductPayload } from '../../../src/api-hooks/product.api';

export default function AddProduct() {
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();

  const handleSubmit = (values: any, images?: { uri?: string, mimeType?: string }[]) => {
    const payload: CreateProductPayload = {
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

    // Append images
    if (images) {
      images.forEach((image, index) => {
        if (image.uri) {
          formData.append('images', {
            uri: image.uri,
            name: `image-${index}.jpg`,
            // type: 'image/jpeg',
            type: image.mimeType as any,
          } as any);
        }
      });
    }

    createProduct(formData, {
      onSuccess: (data) => {
        Alert.alert('Success', 'Product created successfully!');
        // Reset form or navigate
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create product');
      },
    });
  };

  const initialValues = {
    name: '',
    shortDescription: '',
    longDescription: '',
    unitId: 0,
    price: '',
    deals: [{ quantity: '', price: '' }],
  };

  return (
    <AppContainer>
      <ProductForm
        mode="create"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={isCreating}
      />
    </AppContainer>
  );
}