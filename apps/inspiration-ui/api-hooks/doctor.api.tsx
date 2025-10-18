import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/axios";
import { Doctor, DoctorSpecialization as Specialization } from "shared-types";

/**
 * Hook to fetch doctors who are not associated with any hospital
 */
export function useGetUnassignedDoctors() {
  return useQuery<Doctor[]>({
    queryKey: ['doctors', 'unassigned'],
    queryFn: async () => {
      const response = await axios.get('/doctors/unassigned');
      return response.data;
    }
  });
}

/**
 * Hook to add doctors to a hospital
 */
export function useAddDoctorsToHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hospitalId, doctorIds }: { hospitalId: number, doctorIds: number[] }) => {
      const response = await axios.post(`/hospitals/${hospitalId}/doctors`, { doctorIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });
}

/**
 * Hook to remove a doctor from a hospital
 */
export function useRemoveDoctorFromHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hospitalId, doctorId }: { hospitalId: number, doctorId: number }) => {
      const response = await axios.delete(`/hospitals/${hospitalId}/doctors/${doctorId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });
}

/**
 * Hook to fetch specializations for a specific doctor
 */
export function useDoctorSpecializations(doctorId?: number) {
  return useQuery<Specialization[]>({
    queryKey: ['doctor-specializations', doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      if (!doctorId) return [];
      const response = await axios.get<Specialization[]>(`/doctors/${doctorId}/specializations`);
      return response.data;
    }
  });
}


/**
 * Hook to fetch upcoming leaves for a doctor
 */
export function useGetDoctorUpcomingLeaves(doctorId?: number) {
  return useQuery({
    queryKey: ['doctor-upcoming-leaves', doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      if (!doctorId) return [];
      const response = await axios.get(`/doctors/${doctorId}/upcoming-leaves`);
      return response.data;
    }
  });
}
/**
 * Hook to mark doctor's leave for a date range
 */
export function useMarkDoctorLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, startDate, endDate }: { doctorId: number, startDate: string, endDate: string }) => {
      const response = await axios.post(`/doctors/${doctorId}/mark-leave`, { startDate, endDate });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
    }
  });
}

/**
 * Hook to update doctor's inning (pause/resume consultations)
 * Usage: useUpdateDoctorInning()
 */
export function useUpdateDoctorInning() {
  return useMutation({
    mutationFn: async (data: { doctorId: number; date: string; isPaused: boolean; pauseReason?: string }) => {
      const response = await axios.post('/doctors/update-inning', data);
      return response.data;
    },
  });
}