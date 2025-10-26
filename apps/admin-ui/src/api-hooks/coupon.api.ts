import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosAdmin from "../../services/axios-admin-ui";

export interface Coupon {
  id: number;
  couponCode: string;
  isUserBased: boolean;
  discountPercent?: string | null;
  flatDiscount?: string | null;
  minOrder?: string | null;
  targetUser?: number | null;
  productIds?: number[] | null;
  createdBy: number | null;
  maxValue?: string | null;
  isApplyForAll: boolean | null;
  validTill?: string | null;
  maxLimitForUser?: number | null;
  isInvalidated: boolean;
  createdAt: string;
  targetUserDetails?: { id: number; name: string; email?: string } | null;
  creator: { id: number; name: string };
}

export interface CreateCouponPayload {
  couponCode?: string;
  isUserBased?: boolean;
  discountPercent?: number;
  flatDiscount?: number;
  minOrder?: number;
  targetUser?: number;
  productIds?: number[];
  maxValue?: number;
  isApplyForAll?: boolean;
  validTill?: string;
  maxLimitForUser?: number;
}

export const useGetCoupons = () => {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const response = await axiosAdmin.get<Coupon[]>("/av/coupons");
      return response.data;
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: CreateCouponPayload) => {
      const response = await axiosAdmin.post<Coupon>("/av/coupons", coupon);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Coupon> & { id: number }) => {
      const response = await axiosAdmin.put<Coupon>(
        `/av/coupons/${id}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axiosAdmin.delete(`/av/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};
