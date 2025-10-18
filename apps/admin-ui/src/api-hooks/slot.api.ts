import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

// Types
export interface CreateSlotPayload {
  deliveryTime: string;
  freezeTime: string;
  isActive?: boolean;
}

export interface CreateSlotResponse {
  slot: {
    id: number;
    deliveryTime: string;
    freezeTime: string;
    isActive: boolean;
  };
  message: string;
}

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

export interface UpdateSlotPayload extends CreateSlotPayload {
  id: number;
}

export interface UpdateSlotResponse extends CreateSlotResponse {}

// API functions
const createSlotApi = async (payload: CreateSlotPayload): Promise<CreateSlotResponse> => {
  const response = await axios.post('/slots', payload);
  return response.data;
};

const getSlotsApi = async (): Promise<GetSlotsResponse> => {
  const response = await axios.get('/slots');
  return response.data;
};

const updateSlotApi = async (payload: UpdateSlotPayload): Promise<UpdateSlotResponse> => {
  const { id, ...updateData } = payload;
  const response = await axios.put(`/slots/${id}`, updateData);
  return response.data;
};

const deleteSlotApi = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`/slots/${id}`);
  return response.data;
};

// Hooks
export const useCreateSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSlotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
};

export const useGetSlots = () => {
  return useQuery({
    queryKey: ['slots'],
    queryFn: getSlotsApi,
  });
};

export const useUpdateSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSlotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
};

export const useDeleteSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSlotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
};