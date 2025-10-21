import { useQuery } from "@tanstack/react-query";
import axios from 'common-ui/src/services/axios';

export interface EligibleCoupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxValue?: number;
  minOrder?: number;
  description: string;
}

const getEligibleCouponsApi = async (orderAmount: number): Promise<EligibleCoupon[]> => {
  const response = await axios.get(`/uv/coupons/eligible?orderAmount=${orderAmount}`);
  return response.data.data;
};

export const useGetEligibleCoupons = (orderAmount: number, enabled = true) => {
  return useQuery({
    queryKey: ['eligible-coupons', orderAmount],
    queryFn: () => getEligibleCouponsApi(orderAmount),
    enabled: enabled && orderAmount > 0,
  });
};