import { useQuery } from '@tanstack/react-query';
import axios from '../services/axios';

export interface Specialization {
  id: number;
  name: string;
  description: string;
}

/**
 * Hook to fetch all available doctor specializations
 * @returns Query result containing the list of specializations
 */
export const useSpecializations = () => {
  return useQuery<Specialization[]>({
    queryKey: ['specializations'],
    queryFn: async () => {

      const response = await axios.get<Specialization[]>('/specializations');
      
      return response.data;
    }
  });
};
