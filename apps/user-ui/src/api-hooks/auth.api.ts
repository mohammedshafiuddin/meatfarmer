import { useMutation } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';
import { LoginCredentials, RegisterData } from '@/src/types/auth';

// API response types
interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    createdAt: string;
  };
}

interface RegisterResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    createdAt: string;
  };
}

// API functions
const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axios.post('/uv/auth/login', credentials);
  return response.data.data; // response.data is {success, data}, we want the inner data
};

const registerApi = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await axios.post('/uv/auth/register', data);
  return response.data.data; // response.data is {success, data}, we want the inner data
};

// React Query hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: registerApi,
  });
};