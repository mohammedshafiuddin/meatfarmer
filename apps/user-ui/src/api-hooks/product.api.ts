import { useQuery } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

export interface ProductDetails {
  id: number;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  unit: string;
  images: string[];
  isOutOfStock: boolean;
  deliverySlots: {
    deliveryTime: string;
    freezeTime: string;
  }[];
  specialPackageDeals: {
    quantity: string;
    price: string;
    validTill: string;
  }[];
}

const getProductDetailsApi = async (id: number): Promise<ProductDetails> => {
  const response = await axios.get(`/uv/products/${id}`);
  return response.data;
};

export const useGetProductDetails = (id: number) => {
  return useQuery({
    queryKey: ['product-details', id],
    queryFn: () => getProductDetailsApi(id),
    enabled: !!id,
  });
};