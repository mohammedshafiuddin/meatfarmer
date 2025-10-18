import axios from "@/services/axios";
import { useQuery, useMutation, QueryClient, useQueryClient } from "@tanstack/react-query";
import type { User, UpcomingAppointment, token_user } from "common-ui/shared-types";


export interface CreateUserPayload {
  name: string;
  email: string;
  mobile: string;
  address?: string;
  password: string;
  role?: string;
}

export interface CreateBusinessUserPayload {
  name: string;
  username: string;
  password: string;
  role: string;
}

export interface CreateUserResponse {
  user: User;
  message: string;
}

export interface UserResponsibilities {
  hospitalAdminFor: number | null; // ID of hospital the user is admin for, if any
  secretaryFor: number[]; // IDs of doctors the user is secretary for
}

export interface UpdateBusinessUserPayload {
  name: string;
  password?: string; // Optional for updates
  specializationIds?: number[];
  consultationFee?: number;
  dailyTokenCount?: number;
  qualifications?: string;
}

export interface UpdateUserProfilePayload {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  profilePicUrl?: string;
}

import { DoctorDetails } from "common-ui/shared-types";

export function useGetUserById(userId: number | string | undefined | null) {
  
  return useQuery<User | undefined>({
    queryKey: ['user', 'user-details', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      
      const res = await axios.get<User>(`/users/user/${userId}`);
      return res.data;
    },
  });
}

export function useGetDoctorById(doctorId: number | string | undefined | null) {
  
  return useQuery<DoctorDetails | undefined>({
    queryKey: ['doctor', 'doctor-details', doctorId],
    enabled: Boolean(doctorId),
    queryFn: async () => {
      
      const res = await axios.get<DoctorDetails>(`/users/doctor/${doctorId}`);
      return res.data;
    },
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (userPayload: FormData) => {
      try {

        const response = await axios.post('/users/signup', userPayload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }
      catch (error) {
        console.log(error);
      }
    },
  });
}

/**
 * Hook to fetch the responsibilities of the logged-in user
 */
export function useUserResponsibilities(userId: number | null) {
  return useQuery({
    queryKey: ['userResponsibilities'],
    queryFn: async (): Promise<UserResponsibilities> => {
      const response = await axios.get<UserResponsibilities>('/users/responsibilities');
      return response.data;
    },
    enabled: !!userId, // Only run this query if userId is available
  });
}

export interface BusinessUser {
  id: number;
  name: string;
  username: string;
  role: string;
  joinDate: string;
}

export function useUpdateBusinessUser(userId: number) {
  const queryClient = new QueryClient();

  return useMutation<CreateUserResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await axios.put<CreateUserResponse>(
        `/users/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['business-users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

export function useGetBusinessUsers() {
  return useQuery<BusinessUser[]>({
    queryKey: ['business-users'],
    queryFn: async () => {
      const response = await axios.get<BusinessUser[]>('/users/business-users');
      return response.data;
    }
  });
}

/**
 * Hook to update a user's profile
 */

/**
 * Hook to fetch the current user's upcoming appointments
 */
export function useUserUpcomingAppointments() {
  return useQuery<UpcomingAppointment[]>({
    queryKey: ['user-upcoming-appointments'],
    queryFn: async () => {
      const response = await axios.get<{ appointments: UpcomingAppointment[] }>('/users/upcoming-tokens');
      return response.data.appointments;
    },
  });
}

export function useHasPushToken({enabled}: {enabled: boolean}) {
  return useQuery<boolean>({
    queryKey: ['has-push-token'],
    queryFn: async () => {
      const res = await axios.get('/users/has-push-token');
      return res.data.hasPushToken;
    },
    refetchOnMount: true,
    enabled,
  });
}


export function useAddPushToken() {
  return useMutation({
    mutationFn: async (pushToken: string) => {
      const res = await axios.post('/users/push-token', { pushToken });
      return res.data;
    },
  });
}

export function useSearchUserByMobile(mobile: string) {
  return useQuery<token_user[]>(({
    queryKey: ['users', 'search', mobile],
    enabled: !!mobile && mobile.length >= 10,
    queryFn: async () => {
      const res = await axios.get<{ users: token_user[] }>(`/users/search?mobile=${mobile}`);
      return res.data.users;
    },
  }));
}

export interface PatientDetails {
  name: string;
  age: number;
  gender: string;
  last_consultation: string;
  consultationHistory: Array<{
    date: string;
    doctorDetails: {
      id: string;
      name: string;
    };
    notes: string;
  }>;
}

export function useGetPatientDetails(patientId: number | string | undefined | null) {
  return useQuery<PatientDetails | undefined>({
    queryKey: ['patient-details', patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const res = await axios.get<PatientDetails>(`/users/patient-details/${patientId}`);
      return res.data;
    },
  });
}