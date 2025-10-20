import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosAdmin from '../../services/axios-admin-ui';

export interface Order {
  orderId: string;
  readableId: number;
  customerName: string;
  address: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number; amount: number }[];
  deliveryTime: string;
  status: 'pending' | 'delivered' | 'cancelled';
  isPackaged: boolean;
  isDelivered: boolean;
  isCod: boolean;
  slotId: number | null;
}

export const useGetTodaysOrders = (slotId?: number | null) => {
  return useQuery({
    queryKey: ['todays-orders', slotId],
    queryFn: async (): Promise<Order[]> => {
      const params = slotId ? { slotId } : {};
      const response = await axiosAdmin.get('/av/orders/today', { params });
      return response.data.data;
    },
  });
};

export const useGetDeliveryOrders = (slotId?: number | null) => {
  return useQuery({
    queryKey: ['delivery-orders', slotId],
    queryFn: async (): Promise<Order[]> => {
      const params = slotId ? { slotId } : {};
      const response = await axiosAdmin.get('/av/orders/delivery', { params });
      return response.data.data;
    },
  });
};

export const useUpdatePackaged = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, isPackaged }: { orderId: string; isPackaged: boolean }) => {
      const response = await axiosAdmin.put(`/av/orders/${orderId}/packaged`, { isPackaged });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-orders'] });
    },
  });
};

export const useUpdateDelivered = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, isDelivered }: { orderId: string; isDelivered: boolean }) => {
      const response = await axiosAdmin.put(`/av/orders/${orderId}/delivered`, { isDelivered });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-orders'] });
    },
  });
};