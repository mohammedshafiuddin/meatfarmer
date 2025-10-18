import axios from '@/services/axios';
import { useQuery } from '@tanstack/react-query';

// Fetch PhonePe credentials
export function usePhonepeCreds() {
  return useQuery({
    queryKey: ['phonepe-creds'],
    queryFn: async () => {
      const response = await axios.get('/payments/get-phonepe-creds');
      return response.data;
    },
  });
}