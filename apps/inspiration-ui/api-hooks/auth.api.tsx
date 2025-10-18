import axios from "@/services/axios";
import { useMutation } from "@tanstack/react-query";

export interface LoginPayload {
  login: string; // Can be email or mobile
  password: string;
  useUsername?: boolean;
}

export interface LoginOtpPayload {
  mobile: string;
  otp: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    roles: string[];
  };
  token: string; // Now non-optional as the backend will always send it
  message: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  mobile: string;
  address: string;
  password: string;
}

export interface SignupResponse {
  user: {
    id: number;
    name: string;
    email: string;
    mobile: string;
  };
  message: string;
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      // Use the shared axios instance directly
      await axios.post('/users/logout');
    },
    retry: false
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      console.log({payload})
      
      // Use the shared axios instance directly
      const response = await axios.post<LoginResponse>('/users/login', payload);
      const data = response.data;
      return data;
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const response = await axios.post<SignupResponse>('/users/signup', payload);
      return response.data;
    },
  });
}