import axios from "@/services/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DashboardDoctor, Doctor, DoctorSpecialization, Hospital } from "shared-types";

// Create hospital payload interface
export interface CreateHospitalPayload {
  name: string;
  description?: string;
  address: string;
  adminId?: number;
}

// Update hospital payload interface
export interface UpdateHospitalPayload extends CreateHospitalPayload {
  id: number;
  doctorsToAdd?: number[];
  doctorsToRemove?: number[];
}

// Hospital response interfaces
export interface CreateHospitalResponse {
  hospital: Hospital;
  message: string;
}

export interface UpdateHospitalResponse {
  hospital: Hospital;
  message: string;
}

export interface GetHospitalsResponse {
  hospitals: Hospital[];
  count: number;
}

/**
 * Hook to fetch all hospitals
 */
export function useGetHospitals() {
  return useQuery<GetHospitalsResponse>({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const res = await axios.get<GetHospitalsResponse>('/hospitals');
      return res.data;
    },
  });
}

/**
 * Hook to fetch a single hospital by ID
 */
export function useGetHospitalById(hospitalId: number | string | undefined) {
  return useQuery<Hospital | undefined>({
    queryKey: ['hospital', hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      if (!hospitalId) return undefined;
      const res = await axios.get<{ hospital: Hospital }>(`/hospitals/${hospitalId}`);
      return res.data.hospital;
    },
  });
}

/**
 * Hook to create a new hospital
 */
export function useCreateHospital() {
  const queryClient = useQueryClient();
  
  return useMutation<CreateHospitalResponse, Error, FormData>({
    mutationFn: async (hospitalPayload: FormData) => {
      const response = await axios.post<CreateHospitalResponse>('/hospitals', hospitalPayload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch hospitals list query
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });
}

/**
 * Hook to update an existing hospital
 */
export function useUpdateHospital() {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateHospitalResponse, Error, FormData>({
    mutationFn: async (hospitalPayload: FormData) => {
      const id = hospitalPayload.get("id");
      hospitalPayload.delete("id");
      console.log(id, hospitalPayload);
      
      const response = await axios.put<UpdateHospitalResponse>(`/hospitals/${id}`, hospitalPayload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch specific hospital and hospitals list
      queryClient.invalidateQueries({ queryKey: ['hospital'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });
}

/**
 * Hook to delete a hospital
 */
export function useDeleteHospital() {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (hospitalId: number) => {
      const response = await axios.delete<{ message: string }>(`/hospitals/${hospitalId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch hospitals list
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });
}

export interface PotentialHospitalAdmin {
  id: number;
  name: string;
  username: string;
  roles: string[];
}

/**
 * Hook to fetch potential hospital admins (users with appropriate roles)
 */
export function useGetPotentialHospitalAdmins() {
  return useQuery<PotentialHospitalAdmin[]>({
    queryKey: ['potential-hospital-admins'],
    queryFn: async () => {
      const response = await axios.get<PotentialHospitalAdmin[]>('/users/potential-hospital-admins');
      return response.data;
    }
  });
}

export interface DoctorWithSpecializations extends Doctor {
  specializations?: DoctorSpecialization[];
  profilePicUrl: string | null;
}

export interface HospitalDoctorsData {
  doctors: DoctorWithSpecializations[];
}

/**
 * Hook to fetch hospital doctors data
 */
export function useGetHospitalDoctors(hospitalId: number | null | undefined) {
  return useQuery<HospitalDoctorsData>({
    queryKey: ['hospitalDoctors', hospitalId],
    queryFn: async () => {
      if (!hospitalId) {
        throw new Error("Hospital ID is required");
      }
      const response = await axios.get(`/hospitals/${hospitalId}/doctors`);
      return response.data;
    },
    enabled: !!hospitalId, // Only run the query if hospitalId is provided
  });
}

export interface HospitalAdminDashboardData {
  hospital: Hospital;
  doctors: DashboardDoctor[];
  admins: PotentialHospitalAdmin[];
  currentDate: string;
  totalDoctors: number;
  totalAppointmentsToday: number;
  totalConsultationsDone: number;
}

/**
 * Hook to fetch hospital admin dashboard data
 */
export function useHospitalAdminDashboard(hospitalId: number | null | undefined) {
  return useQuery<HospitalAdminDashboardData>({
    queryKey: ['hospitalAdminDashboard', hospitalId],
    queryFn: async () => {
      if (!hospitalId) {
        throw new Error("Hospital ID is required");
      }
      const response = await axios.get(`/hospitals/admin-dashboard/${hospitalId}`);
      return response.data;
    },
    enabled: !!hospitalId, // Only run the query if hospitalId is provided
  });
}
