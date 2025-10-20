import { useQuery } from "@tanstack/react-query";
import axios from '../services/axios';
import type { ProductSummary, GetSlotsProductIdsPayload, GetSlotsProductIdsResponse } from '../../shared-types';

export interface GetProductsSummaryResponse {
  products: ProductSummary[];
  count: number;
}

const getAllProductsSummaryApi = async (): Promise<GetProductsSummaryResponse> => {
  
  const response = await axios.get('/cm/products/summary');
  console.log('getting products summary');
  console.log({response});
  
  return response.data;
};

export const useGetAllProductsSummary = () => {
  return useQuery({
    queryKey: ['products-summary'],
    // queryFn: getAllProductsSummaryApi,
    queryFn: async () => {
      const response = await axios.get('/cm/products/summary');
      console.log({response: response.config})
      
      return response.data;
    }
  });
};

const getSlotsProductIdsApi = async (payload: GetSlotsProductIdsPayload): Promise<GetSlotsProductIdsResponse> => {
  const response = await axios.post('/av/products/slots/product-ids', payload);
  return response.data;
};

export const useGetSlotsProductIds = (slotIds: number[]) => {
  return useQuery({
    queryKey: ['slots-product-ids', slotIds],
    queryFn: () => getSlotsProductIdsApi({ slotIds }),
    enabled: slotIds.length > 0,
  });
};