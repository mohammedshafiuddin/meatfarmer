import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from '../../services/axios-admin-ui';

// Types
export interface CreateTagPayload {
  tagName: string;
  tagDescription?: string;
  imageUrl?: string;
  isDashboardTag: boolean;
}

export interface UpdateTagPayload {
  tagName: string;
  tagDescription?: string;
  imageUrl?: string;
  isDashboardTag: boolean;
}

export interface Tag {
  id: number;
  tagName: string;
  tagDescription: string | null;
  imageUrl: string | null;
  isDashboardTag: boolean;
  createdAt?: string;
}

export interface CreateTagResponse {
  tag: Tag;
  message: string;
}

export interface GetTagsResponse {
  tags: Tag[];
  message: string;
}

// API functions
const createTagApi = async (formData: FormData): Promise<CreateTagResponse> => {
  const response = await axios.post('/av/product-tags', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateTagApi = async ({ id, formData }: { id: number; formData: FormData }): Promise<CreateTagResponse> => {
  const response = await axios.put(`/av/product-tags/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const deleteTagApi = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`/av/product-tags/${id}`);
  return response.data;
};

const getTagsApi = async (): Promise<GetTagsResponse> => {
  const response = await axios.get('/av/product-tags');
  return response.data;
};

const getTagApi = async (id: number): Promise<{ tag: Tag }> => {
  const response = await axios.get(`/av/product-tags/${id}`);
  return response.data;
};

// Hooks
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTagApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTagApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTagApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useGetTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTagsApi,
  });
};

export const useGetTag = (id: number) => {
  return useQuery({
    queryKey: ['tags', id],
    queryFn: () => getTagApi(id),
    enabled: !!id,
  });
};