import axios from "@/services/axios";
import { useQuery } from "@tanstack/react-query";

export interface PotentialHospitalAdmin {
  id: number;
  name: string;
  username: string;
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

export interface PotentialDoctorEmployee {
  id: number;
  name: string;
  username: string;
  roles: string[];
}

/**
 * Hook to fetch potential doctor employees (users with doctor role not assigned to a hospital)
 */
export function useGetPotentialDoctorEmployees() {
  return useQuery<PotentialDoctorEmployee[]>({
    queryKey: ['potential-doctor-employees'],
    queryFn: async () => {
      const response = await axios.get<PotentialDoctorEmployee[]>('/users/potential-doctor-employees');
      return response.data;
    }
  });
}
