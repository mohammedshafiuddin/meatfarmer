import { router, protectedProcedure } from '../trpc-index';
import { db } from '../../db/db_index';
import { coupons, couponUsage } from '../../db/schema';
import { eq, and, or, gt, isNull } from 'drizzle-orm';

export interface EligibleCoupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxValue?: number;
  minOrder?: number;
  description: string;
  exclusiveApply?: boolean;
  isEligible: boolean;
  ineligibilityReason?: string;
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

export interface CouponDisplay {
  id: number;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxValue?: number;
  minOrder?: number;
  description: string;
  validTill?: Date;
  usageCount: number;
  maxLimitForUser?: number;
  isExpired: boolean;
  isUsedUp: boolean;
}

export const userCouponRouter = router({
  getEligible: protectedProcedure
    .query(async ({ ctx }) => {
      console.log('getting eligible coupons')

      const userId = ctx.user.userId;

      // Get all active, non-expired coupons that apply to this user
      const allCoupons = await db.query.coupons.findMany({
        where: and(
          eq(coupons.isInvalidated, false),
          or(
            eq(coupons.isApplyForAll, true),
            eq(coupons.targetUser, userId)
          ),
          or(
            isNull(coupons.validTill),
            gt(coupons.validTill, new Date())
          )
        ),
        with: {
          usages: {
            where: eq(couponUsage.userId, userId)
          },
          applicableUsers: true,
          applicableProducts: true,
        }
      });

      // Filter to only coupons applicable to current user
      const applicableCoupons = allCoupons.filter(coupon => {
        const applicableUsers = coupon.applicableUsers || [];
        return applicableUsers.length === 0 || applicableUsers.some(au => au.userId === userId);
      });

      return { success: true, data: applicableCoupons };
    }),

  getMyCoupons: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;

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

      // Categorize coupons
      const personalCoupons: CouponDisplay[] = [];
      const generalCoupons: CouponDisplay[] = [];

      allCoupons.forEach(coupon => {
        const usageCount = coupon.usages.length;
        const isExpired = Boolean(coupon.validTill && new Date(coupon.validTill) < new Date());
        const isUsedUp = Boolean(coupon.maxLimitForUser && usageCount >= coupon.maxLimitForUser);

        const couponDisplay: CouponDisplay = {
          id: coupon.id,
          code: coupon.couponCode,
          discountType: coupon.discountPercent ? 'percentage' : 'flat',
          discountValue: parseFloat(coupon.discountPercent || coupon.flatDiscount || '0'),
          maxValue: coupon.maxValue ? parseFloat(coupon.maxValue) : undefined,
          minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
          description: generateCouponDescription(coupon),
          validTill: coupon.validTill ? new Date(coupon.validTill) : undefined,
          usageCount,
          maxLimitForUser: coupon.maxLimitForUser ? parseInt(coupon.maxLimitForUser.toString()) : undefined,
          isExpired,
          isUsedUp,
        };

        if (coupon.targetUser === userId && !coupon.isApplyForAll) {
          // Personal coupon
          personalCoupons.push(couponDisplay);
        } else if (coupon.isApplyForAll) {
          // General coupon
          generalCoupons.push(couponDisplay);
        }
      });

      return {
        success: true,
        data: {
          personal: personalCoupons,
          general: generalCoupons,
        }
      };
    }),
});