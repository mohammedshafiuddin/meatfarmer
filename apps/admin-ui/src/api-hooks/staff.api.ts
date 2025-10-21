import { useMutation } from "@tanstack/react-query";
import axios from '../../services/axios-admin-ui';

// Types
export interface StaffLoginPayload {
  name: string;
  password: string;
}

export interface StaffLoginResponse {
  message: string;
  token: string;
  staff: {
    id: number;
    name: string;
  };
}

// API functions
const staffLoginApi = async (payload: StaffLoginPayload): Promise<StaffLoginResponse> => {
  const response = await axios.post('/av/staff/login', payload);
  return response.data;
};

// Hooks
export const useStaffLogin = () => {
  return useMutation({
    mutationFn: staffLoginApi,
  });
};