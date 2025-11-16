import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from '../../services/axios-admin-ui';

// Types
export interface CreateProductPayload {
  name: string;
  shortDescription?: string;
  longDescription?: string;
  unitId: number;
  storeId: number;
  price: number;
  marketPrice?: number;
  isOutOfStock?: boolean;
  deals?: {
    quantity: number;
    price: number;
    validTill: string;
  }[];
}

export interface UpdateProductPayload {
  name: string;
  shortDescription?: string;
  longDescription?: string;
  unitId: number;
  storeId: number;
  price: number;
  marketPrice?: number;
  isOutOfStock?: boolean;
  deals?: {
    quantity: number;
    price: number;
    validTill: string;
  }[];
}

export interface Product {
  id: number;
  name: string;
  shortDescription?: string | null;
  longDescription?: string;
  unitId: number;
  storeId: number;
  price: number;
  marketPrice?: number;
  isOutOfStock?: boolean;
  images?: string[];
  createdAt: string;
  unit?: {
    id: number;
    shortNotation: string;
    fullName: string;
  };
  deals?: {
    id: number;
    quantity: string;
    price: string;
    validTill: string;
  }[];
}

export interface CreateProductResponse {
  product: Product;
  deals?: any[];
  message: string;
}

// API functions
const createProductApi = async (formData: FormData): Promise<CreateProductResponse> => {
  const response = await axios.post('/av/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateProductApi = async ({ id, formData }: { id: number; formData: FormData }): Promise<CreateProductResponse> => {
  const response = await axios.put(`/av/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Hooks
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
