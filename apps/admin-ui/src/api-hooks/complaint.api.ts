import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from '../../services/axios-admin-ui';

export interface Complaint {
  id: number;
  text: string;
  userId: number;
  userName: string;
  orderId: number | null;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface GetComplaintsResponse {
  complaints: Complaint[];
  totalCount: number;
}

const getComplaintsApi = async ({ page, limit }: { page: number; limit: number }): Promise<GetComplaintsResponse> => {
  const response = await axios.get(`/av/complaints?page=${page}&limit=${limit}`);
  return response.data;
};

const resolveComplaintApi = async (id: number): Promise<{ message: string }> => {
  const response = await axios.patch(`/av/complaints/${id}/resolve`);
  return response.data;
};

export const useGetComplaints = ({ page, limit }: { page: number; limit: number }) => {
  return useQuery({
    queryKey: ['complaints', page, limit],
    queryFn: () => getComplaintsApi({ page, limit }),
  });
};

export const useResolveComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveComplaintApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
};