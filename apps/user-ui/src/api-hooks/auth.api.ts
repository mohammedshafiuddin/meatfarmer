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
    profileImage?: string;
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
    profileImage?: string;
    createdAt: string;
  };
}

interface UpdateProfileResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string | null;
    mobile: string | null;
    profileImage?: string | null;
    bio?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    occupation?: string | null;
  };
}

// API functions
const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axios.post('/uv/auth/login', credentials);
  return response.data.data; // response.data is {success, data}, we want the inner data
};

const registerApi = async (data: FormData): Promise<RegisterResponse> => {
  const response = await axios.post('/uv/auth/register', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data; // response.data is {success, data}, we want the inner data
};

const updateProfileApi = async (data: FormData): Promise<UpdateProfileResponse> => {
  const response = await axios.put('/uv/auth/profile', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: updateProfileApi,
    onError: e => console.log(JSON.stringify(e))
  });
};