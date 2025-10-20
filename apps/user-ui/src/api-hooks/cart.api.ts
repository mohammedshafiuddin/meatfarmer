import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

// Types
export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  addedAt: string;
  product: {
    id: number;
    name: string;
    price: number;
    unit: string;
    images: string[];
  };
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface Slot {
  id: number;
  deliveryTime: string;
  freezeTime: string;
}

export interface CartSlotsResponse {
  [productId: number]: Slot[];
}

// API functions
const getCartApi = async (): Promise<CartResponse> => {
  const response = await axios.get('/uv/cart');
  return response.data;
};

const addToCartApi = async (productId: number, quantity: number): Promise<CartResponse> => {
  const response = await axios.post('/uv/cart', { productId, quantity });
  return response.data;
};

const updateCartItemApi = async (itemId: number, quantity: number): Promise<CartResponse> => {
  const response = await axios.put(`/uv/cart/${itemId}`, { quantity });
  return response.data;
};

const removeFromCartApi = async (itemId: number): Promise<CartResponse> => {
  const response = await axios.delete(`/uv/cart/${itemId}`);
  return response.data;
};

const getCartSlotsApi = async (): Promise<CartSlotsResponse> => {
  const response = await axios.get('/uv/cart/slots');
  return response.data;
};

// Hooks
export const useGetCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: getCartApi,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      addToCartApi(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItemApi(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => removeFromCartApi(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useGetCartSlots = () => {
  return useQuery({
    queryKey: ['cart-slots'],
    queryFn: getCartSlotsApi,
  });
};