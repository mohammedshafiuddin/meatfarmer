import { router, protectedProcedure } from '../trpc-index';
import { number, z } from 'zod';
import { db } from '../../db/db_index';
import { coupons, couponUsage } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';

export interface EligibleCoupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxValue?: number;
  minOrder?: number;
  description: string;
}

const generateCouponDescription = (coupon: any): string => {
  let desc = '';

  if (coupon.discountPercent) {
    desc += `${coupon.discountPercent}% off`;
  } else if (coupon.flatDiscount) {
    desc += `₹${coupon.flatDiscount} off`;
  }

  if (coupon.minOrder) {
    desc += ` on orders above ₹${coupon.minOrder}`;
  }

  if (coupon.maxValue) {
    desc += ` (max discount ₹${coupon.maxValue})`;
  }

  return desc;
};

export const userCouponRouter = router({
  getEligible: protectedProcedure
    .input(z.object({
      orderAmount: z.number().optional().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const orderAmount = input.orderAmount;

      // Get all active coupons that apply to this user
      const allCoupons = await db.query.coupons.findMany({
        where: and(
          eq(coupons.isInvalidated, false),
          or(
            eq(coupons.isApplyForAll, true),
            eq(coupons.targetUser, userId)
          )
        ),
        with: {
          usages: {
            where: eq(couponUsage.userId, userId)
          }
        }
      });

      // Filter eligible coupons
      const eligibleCoupons = allCoupons.filter(coupon => {
        // Check expiration
        if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
          return false;
        }

        // Check minimum order requirement
        if (coupon.minOrder && parseFloat(coupon.minOrder) > orderAmount) {
          return false;
        }

        // Check usage limits - user can use coupon up to maxLimitForUser times
        if (coupon.maxLimitForUser) {
          const usageCount = coupon.usages.length;
          if (usageCount >= coupon.maxLimitForUser) {
            return false; // Already used maximum allowed times
          }
        }

        return true;
      });

      // Format response
      const formattedCoupons: EligibleCoupon[] = eligibleCoupons.map(coupon => ({
        id: coupon.id,
        code: coupon.couponCode,
        discountType: coupon.discountPercent ? 'percentage' : 'flat',
        discountValue: parseFloat(coupon.discountPercent || coupon.flatDiscount || '0'),
        maxValue: coupon.maxValue ? parseFloat(coupon.maxValue) : undefined,
        minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
        description: generateCouponDescription(coupon),
      }));

      return { success: true, data: formattedCoupons };
    }),
});