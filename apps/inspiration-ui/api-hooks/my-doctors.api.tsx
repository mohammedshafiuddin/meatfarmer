import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/axios";
import { Doctor } from "common-ui/shared-types";

/**
 * Hook to fetch doctors based on user's responsibilities:
 * - If the user is a hospital admin, returns all doctors in that hospital
 * - If the user is a secretary, returns all doctors they are secretary for
 * - Otherwise returns an empty array
 */
export function useGetMyDoctors({enabled}: {enabled: boolean}) {
  return useQuery<Doctor[]>({
    queryKey: ['my-doctors'],
    queryFn: async () => {
      const response = await axios.get('/doctors/my-doctors');
      return response.data;
    },
    enabled
  });   
}

/**
 * Hook to fetch a specific doctor by ID from the my-doctors list
 * This uses the my-doctors endpoint and then filters for the specific doctor
 */
export function useGetMyDoctorById(doctorId?: number) {
  const { data: allMyDoctors, ...rest } = useGetMyDoctors({enabled: !!doctorId});
  
  const doctor = doctorId && allMyDoctors 
    ? allMyDoctors.find(doc => doc.id === doctorId) 
    : undefined;
  
  return {
    ...rest,
    data: doctor
  };
}