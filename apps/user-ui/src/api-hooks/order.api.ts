import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

// Types
export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  image: string | null;
}

export interface Order {
  orderId: string;
  orderDate: string;
  deliveryStatus: string;
  deliveryDate?: string;
  orderStatus: string;
  cancelReason: string | null;
  paymentMode: string;
  isRefundDone: boolean;
  userNotes: string | null;
  items: OrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
}

// API functions
const getUserOrdersApi = async (): Promise<OrdersResponse> => {
  const response = await axios.get('/uv/orders');
  return response.data;
};

const cancelOrderApi = async (orderId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(`/uv/orders/${orderId}/cancel`, { reason });
  return response.data;
};

const raiseComplaintApi = async (orderId: string, complaintBody: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post('/uv/complaints', { orderId, complaintBody });
  return response.data;
};

// Hooks
export const useGetUserOrders = () => {
  return useQuery({
    queryKey: ['user-orders'],
    queryFn: getUserOrdersApi,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      cancelOrderApi(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    },
  });
};

export const useRaiseComplaint = () => {
  return useMutation({
    mutationFn: ({ orderId, complaintBody }: { orderId: string; complaintBody: string }) =>
      raiseComplaintApi(orderId, complaintBody),
  });
};