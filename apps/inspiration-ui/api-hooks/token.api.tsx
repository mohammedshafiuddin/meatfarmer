import axios from "@/services/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DoctorAvailability, 
  DoctorAvailabilityWithDate, 
  DoctorAvailabilityResponse, 
  DoctorAvailabilityPayload,
  BookTokenPayload,
  BookTokenResponse,
  UpcomingToken,
  MyTokensResponse,
  PastToken,
  PastTokensResponse,
  HospitalTodaysTokensResponse,
  DoctorTodaysTokensResponse,
  DoctorTodayToken,
  GetHospitalPatientHistoryResponse,
  PatientHistoryFilters
} from "common-ui/shared-types";

interface SingleDoctorAvailabilityResponse {
  message: string;
  availability: DoctorAvailability;
}

/**
 * Hook to fetch a doctor's availability for the next 3 days or 30 days if fullMonth is true
 * @param doctorId The ID of the doctor
 * @param fullMonth Whether to fetch 30 days instead of 3 (default: false)
 */
export function useGetDoctorAvailabilityForNextDays(doctorId: number | string | undefined, fullMonth: boolean = false) {
  return useQuery<DoctorAvailabilityResponse>({
    queryKey: ['doctor-availability-next-days', doctorId, fullMonth],
    enabled: !!doctorId,
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      const response = await axios.get<DoctorAvailabilityResponse>(
        `/tokens/doctor-availability/next-days?doctorId=${doctorId}&full-month=${fullMonth}`
      );
      return response.data;
    },
  });
}

/**
 * Hook to fetch a doctor's availability for a specific date
 * @param doctorId The ID of the doctor
 * @param date The date in YYYY-MM-DD format
 */
export function useGetDoctorAvailability(doctorId: number | undefined, date: string | undefined) {
  return useQuery<DoctorAvailability | null>({
    queryKey: ['doctor-availability', doctorId, date],
    enabled: !!doctorId && !!date,
    queryFn: async () => {
      try {
        if (!doctorId || !date) return null;
        const response = await axios.get<DoctorAvailability>(
          `/tokens/doctor-availability?doctorId=${doctorId}&date=${date}`
        );
        return response.data;
      } catch (error: any) {
        // If the API returns 404, it means the doctor doesn't have availability for that date
        if (error.response && error.response.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false, // Don't retry on failure since we expect 404s for unavailable dates
  });
}

/**
 * Hook to fetch a doctor's availability for multiple dates
 * @param doctorId The ID of the doctor
 * @param dates An array of dates in YYYY-MM-DD format
 */
export function useGetDoctorAvailabilities(doctorId: number | undefined, dates: string[]) {
  return useQuery<Record<string, DoctorAvailability | null>>({
    queryKey: ['doctor-availabilities', doctorId, ...dates],
    enabled: !!doctorId && dates.length > 0,
    queryFn: async () => {
      if (!doctorId) return {};
      
      const result: Record<string, DoctorAvailability | null> = {};
      
      // Execute requests in parallel
      const promises = dates.map(async (date) => {
        try {
          const response = await axios.get<DoctorAvailability>(
            `/tokens/doctor-availability?doctorId=${doctorId}&date=${date}`
          );
          result[date] = response.data;
        } catch (error) {
          result[date] = null;
        }
      });
      
      await Promise.all(promises);
      return result;
    },
    retry: false // Don't retry on failure
  });
}

/**
 * Hook to update doctor availability for a date or multiple dates
 */
export function useUpdateDoctorAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation<SingleDoctorAvailabilityResponse[], Error, DoctorAvailabilityPayload[]>({
    mutationFn: async (updates: DoctorAvailabilityPayload[]) => {
      updates.forEach(console.log);
      const updatePromises = updates.map(update => 
        axios.post<SingleDoctorAvailabilityResponse>('/tokens/doctor-availability', update)
      );
      const responses = await Promise.all(updatePromises);
      return responses.map(response => response.data);
    },
    onSuccess: (_, variables) => {
      // Extract doctorId from the first update payload
      const doctorId = variables[0]?.doctorId;
      
      if (doctorId) {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: ['doctor-availability', doctorId] });
        queryClient.invalidateQueries({ queryKey: ['doctor-availabilities', doctorId] });
        queryClient.invalidateQueries({ queryKey: ['doctor-availability-next-days', doctorId] });
      }
    }
  });
}

/**
 * Hook to book a token for a doctor
 */
/**
 * Hook to fetch the current user's upcoming tokens
 */
export function useMyUpcomingTokens() {
  return useQuery<MyTokensResponse>({
    queryKey: ['my-upcoming-tokens'],
    queryFn: async () => {
      const response = await axios.get<MyTokensResponse>('/tokens/my-tokens');
      return response.data;
    },
  });
}

/**
 * Hook to fetch the current user's past tokens
 */
export function usePastTokens() {
  return useQuery<PastTokensResponse>({
    queryKey: ['my-past-tokens'],
    queryFn: async () => {
      const response = await axios.get<PastTokensResponse>('/tokens/my-past-tokens');
      return response.data;
    },
  });
}

/**
 * Hook to fetch today's tokens for a hospital (for hospital admin)
 * Shows token summaries for all doctors in the hospital
 */
export function useHospitalTodaysTokens() {
  return useQuery<HospitalTodaysTokensResponse>({
    queryKey: ['hospital-todays-tokens'],
    queryFn: async () => {
      const response = await axios.get<HospitalTodaysTokensResponse>('/tokens/hospital-today');
      return response.data;
    },
  });
}

/**
 * Hook to fetch today's tokens for a specific doctor
 * Shows all tokens for the doctor with detailed information
 * @param doctorId The ID of the doctor
 */
export function useDoctorTodaysTokens(doctorId: number | null) {
  return useQuery<DoctorTodaysTokensResponse>({
    queryKey: ['doctor-todays-tokens', doctorId],
    queryFn: async () => {
      const response = await axios.get<DoctorTodaysTokensResponse>(`/tokens/doctor-today/${doctorId}`);
      return response.data;
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to update token status
 * @param tokenId The ID of the token to update
 */
export function useUpdateTokenStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tokenId, status, consultationNotes }: { tokenId: number, status?: string, consultationNotes?: string }) => {
      console.log('Making API call to update token status:', { tokenId, status, consultationNotes });
      try {
        const response = await axios.patch(`/tokens/${tokenId}/status`, { status, consultationNotes });
        console.log('Token status update response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error in API call to update token status:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['doctor-todays-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-todays-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['my-upcoming-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['my-past-tokens'] });
    },
    onError: (error) => {
      console.error('Error updating token status:', error);
    }
  });
}

/**
 * Hook to create a new offline token
 */
export function useCreateOfflineToken() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ doctorId, patientName, patientMobile, symptoms, date }: { doctorId: number, patientName: string, patientMobile: string, symptoms: string, date: string }) => {
      const response = await axios.post('/tokens/offline', { 
        doctorId, 
        patientName, 
        patientMobile,
        symptoms,
        date
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['hospital-todays-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-tokens', variables.doctorId] });
    }
  });
}

/**
 * Hook to create a new local token
 */
export function useCreateLocalToken() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post('/tokens/local-token', payload);
      return res.data;
    },
  });
}

/**
 * Hook to search tokens by doctor ID and query
 * @param doctorId The ID of the doctor
 * @param query The search query
 */
export function useSearchDoctorTokens(doctorId: number | null, query: string) {
  return useQuery<DoctorTodayToken[]>({ 
    queryKey: ['search-doctor-tokens', doctorId, query],
    queryFn: async () => {
      const response = await axios.get(`/tokens/search?doctorId=${doctorId}&query=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: !!query && query.trim().length > 0 && !!doctorId,
  });
}

// Interface for the new API response
interface GetHospitalTokenHistoryResponse {
  message: string;
  tokens: {
    id: number;
    queueNum: number;
    tokenDate: string;
    doctorName: string;
    patientName: string;
    patientMobile: string;
    status: string;
    description: string;
  }[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * Hook to fetch token history for doctors in the hospital (hospital admin view)
 * @param page The current page number (1-indexed)
 * @param limit The number of items per page
 */
export interface TokenHistoryFilters {
  doctorIds?: string[];
  patientIds?: string[];
  statuses?: string[];
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Hook to fetch token history for doctors in the hospital (hospital admin view)
 * @param page The current page number (1-indexed)
 * @param limit The number of items per page
 * @param filters An object containing filter criteria
 */
export const useGetHospitalTokenHistory = (
  page: number,
  limit: number,
  filters: TokenHistoryFilters
) => {
  return useQuery<GetHospitalTokenHistoryResponse>({
    queryKey: ["hospitalTokenHistory", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.doctorIds && filters.doctorIds.length > 0) {
        params.append("doctorIds", filters.doctorIds.join(","));
      }
      if (filters.patientIds && filters.patientIds.length > 0) {
        params.append("patientIds", filters.patientIds.join(","));
      }
      if (filters.statuses && filters.statuses.length > 0) {
        params.append("statuses", filters.statuses.join(","));
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const response = await axios.get(
        `/tokens/patients/history?${params.toString()}`
      );
      return response.data;
    },
  });
};



/**\n * Hook to fetch patient history for a hospital (hospital admin view)\n * @param page The current page number (1-indexed)\n * @param limit The number of items per page\n */
export const useGetHospitalPatientHistory = (
  page: number,
  limit: number
) => {
  return useQuery<GetHospitalPatientHistoryResponse>({
    queryKey: ["hospitalPatientHistory", page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await axios.get(
        `/tokens/patients/history?${params.toString()}`
      );
      return response.data;
    },
  });
};