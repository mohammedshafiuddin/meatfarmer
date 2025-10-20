import { useQuery } from '@tanstack/react-query';
import axiosAdmin from '../../services/axios-admin-ui';

export interface Order {
  orderId: string;
  customerName: string;
  address: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number; amount: number }[];
  deliveryTime: string;
  status: 'pending' | 'delivered' | 'cancelled';
  isPackaged: boolean;
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