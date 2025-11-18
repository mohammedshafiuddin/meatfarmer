import React, { useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppContainer, useManualRefresh, MyText, tw } from 'common-ui';
import ProductForm, { ProductFormRef } from '../../../src/components/ProductForm';
import { useUpdateProduct } from '../../../src/api-hooks/product.api';
import { trpc } from '@/src/trpc-client';

export default function EditProduct() {
  const { id } = useLocalSearchParams();
  const productId = Number(id);
  const productFormRef = useRef<ProductFormRef>(null);

  // const { data: product, isLoading: isFetching, refetch } = useGetProduct(productId);
  const { data: product, isLoading: isFetching, refetch } = trpc.admin.product.getProductById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );
  //
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  useManualRefresh(() => refetch());

  const handleSubmit = (values: any, newImages?: { uri?: string }[], imagesToDelete?: string[]) => {
    const payload = {
      name: values.name,
      shortDescription: values.shortDescription,
      longDescription: values.longDescription,
      unitId: parseInt(values.unitId),
      storeId: parseInt(values.storeId),
      price: parseFloat(values.price),
      marketPrice: values.marketPrice ? parseFloat(values.marketPrice) : undefined,
      deals: values.deals?.filter((deal: any) =>
        deal.quantity && deal.price && deal.validTill
      ).map((deal: any) => ({
        quantity: parseInt(deal.quantity),
        price: parseFloat(deal.price),
        validTill: deal.validTill instanceof Date
          ? deal.validTill.toISOString().split('T')[0]
          : deal.validTill, // Convert Date to YYYY-MM-DD string
      })),
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'deals' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    // Add new images
    if (newImages && newImages.length > 0) {
      newImages.forEach((image, index) => {
        if (image.uri) {
          const fileName = image.uri.split('/').pop() || `image_${index}.jpg`;
          formData.append('images', {
            uri: image.uri,
            name: fileName,
            type: 'image/jpeg',
          } as any);
        }
      });
    }

    // Add images to delete
    if (imagesToDelete && imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    updateProduct(
      { id: productId, formData },
      {
        onSuccess: (data) => {
          Alert.alert('Success', 'Product updated successfully!');
          // Clear newly added images after successful update
          productFormRef.current?.clearImages();
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
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading product...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (!product) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Product not found</MyText>
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
    storeId: productData.storeId,
    price: productData.price.toString(),
    marketPrice: productData.marketPrice?.toString() || '',
    deals: productData.deals?.map(deal => ({
      quantity: deal.quantity,
      price: deal.price,
      validTill: deal.validTill ? new Date(deal.validTill) : null, // Convert to Date object
    })) || [{ quantity: '', price: '', validTill: null }],
  };

  return (
    <AppContainer>
      <ProductForm
        ref={productFormRef}
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        existingImages={productData.images || []}
      />
    </AppContainer>
  );
}