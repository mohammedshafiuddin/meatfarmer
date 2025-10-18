import { useQuery } from "@tanstack/react-query";
import axios from '../services/axios';
import type { ProductSummary, GetSlotsProductIdsPayload, GetSlotsProductIdsResponse } from '../../shared-types';

export interface GetProductsSummaryResponse {
  products: ProductSummary[];
  count: number;
}

const getAllProductsSummaryApi = async (): Promise<GetProductsSummaryResponse> => {
    console.log('getting products summary');
    
  const response = await axios.get('/products/summary');
  return response.data;
};

export const useGetAllProductsSummary = () => {
  return useQuery({
    queryKey: ['products-summary'],
    queryFn: getAllProductsSummaryApi,
  });
};

const getSlotsProductIdsApi = async (payload: GetSlotsProductIdsPayload): Promise<GetSlotsProductIdsResponse> => {
  const response = await axios.post('/products/slots/product-ids', payload);
  return response.data;
};

export const useGetSlotsProductIds = (slotIds: number[]) => {
  return useQuery({
    queryKey: ['slots-product-ids', slotIds],
    queryFn: () => getSlotsProductIdsApi({ slotIds }),
    enabled: slotIds.length > 0,
  });
};