import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProductDetail from '@/components/ProductDetail';

export default function ProductDetailPage() {
  const { id } = useLocalSearchParams();
  const productId = id as string;

  return <ProductDetail productId={productId} />;
}