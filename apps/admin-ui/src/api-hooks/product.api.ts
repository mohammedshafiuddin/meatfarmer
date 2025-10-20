import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from '../../services/axios-admin-ui';
import type { ProductSummary } from 'common-ui/shared-types';
import { GetProductsSummaryResponse } from "common-ui/src/common-api-hooks/product.api";

// Types
export interface CreateProductPayload {
  name: string;
  shortDescription?: string;
  longDescription?: string;
  unitId: number;
  price: number;
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
  price: number;
  deals?: {
    quantity: number;
    price: number;
    validTill: string;
  }[];
}

export interface Product {
  id: number;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  unitId: number;
  price: number;
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

export interface GetProductsResponse {
  products: Product[];
  count: number;
}

export interface GetProductResponse {
  product: Product;
}



export interface GetSlotProductIdsResponse {
  productIds: number[];
}

export interface UpdateSlotProductsPayload {
  productIds: number[];
}

export interface UpdateSlotProductsResponse {
  message: string;
  added: number;
  removed: number;
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

const getProductsApi = async (): Promise<GetProductsResponse> => {
  const response = await axios.get('/av/products');
  return response.data;
};

const getProductApi = async (id: number): Promise<GetProductResponse> => {
  const response = await axios.get(`/av/products/${id}`);
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

const deleteProductApi = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`/av/products/${id}`);
  return response.data;
};



const getSlotProductIdsApi = async (slotId: number): Promise<GetSlotProductIdsResponse> => {
  const response = await axios.get(`/av/products/slots/${slotId}/product-ids`);
  return response.data;
};

const updateSlotProductsApi = async (
  slotId: number,
  productIds: number[]
): Promise<UpdateSlotProductsResponse> => {
  const response = await axios.put(`/av/products/slots/${slotId}/products`, { productIds });
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

export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProductsApi,
  });
};

export const useGetProduct = (id: number) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductApi(id),
    enabled: !!id,
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

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};



export const useGetSlotProductIds = (slotId: number) => {
  return useQuery({
    queryKey: ['slot-product-ids', slotId],
    queryFn: () => getSlotProductIdsApi(slotId),
    enabled: !!slotId,
  });
};

export const useUpdateSlotProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, productIds }: { slotId: number; productIds: number[] }) =>
      updateSlotProductsApi(slotId, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-product-ids'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
};

const getAllProductsSummaryApi = async (): Promise<GetProductsSummaryResponse> => {
  
  const response = await axios.get('/cm/products/summary');
  console.log('getting products summary');
  console.log({response});
  
  return response.data;
};


export const useGetAllProductsSummary = () => {
  return useQuery({
    queryKey: ['products-summary'],
    queryFn: getAllProductsSummaryApi,
    // queryFn: async () => {
    //   const response = await axios.get('/cm/products/summary');
    //   console.log({response: response.config})
      
    //   return response.data;
    // }
  });
};
