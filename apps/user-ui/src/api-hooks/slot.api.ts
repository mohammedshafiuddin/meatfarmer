import { useQuery } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

// Types
export interface Slot {
  id: number;
  deliveryTime: string;
  freezeTime: string;
  isActive: boolean;
}

export interface GetSlotsResponse {
  slots: Slot[];
  count: number;
}

// API function
const getSlotsApi = async (): Promise<GetSlotsResponse> => {
  const response = await axios.get('/uv/slots');
  return response.data;
};

// Hook
export const useGetSlots = () => {
  return useQuery({
    queryKey: ['slots'],
    queryFn: getSlotsApi,
  });
};