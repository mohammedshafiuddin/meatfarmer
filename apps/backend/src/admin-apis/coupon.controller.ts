import { Request, Response } from "express";
import { db } from "../db/db_index";
import { coupons, users, staffUsers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import type { Coupon } from "../db/types";

type CreateCouponBody = {
  couponCode?: string;
  isUserBased?: boolean;
  discountPercent?: number;
  flatDiscount?: number;
  minOrder?: number;
  targetUser?: number;
  maxValue?: number;
  isApplyForAll?: boolean;
  validTill?: string;
  maxLimitForUser?: number;
};

/**
 * Create a new coupon
 */
export const createCoupon = async (req: Request, res: Response) => {
  const { couponCode, isUserBased, discountPercent, flatDiscount, minOrder, targetUser, maxValue, isApplyForAll, validTill, maxLimitForUser }: CreateCouponBody = req.body;

  // Validation: ensure at least one discount type is provided
  if ((!discountPercent && !flatDiscount) || (discountPercent && flatDiscount)) {
    throw new ApiError("Either discountPercent or flatDiscount must be provided (but not both)", 400);
  }

  // If user-based, targetUser is required (unless it's apply for all)
  if (isUserBased && !targetUser && !isApplyForAll) {
    throw new ApiError("targetUser is required for user-based coupons (or set isApplyForAll to true)", 400);
  }

  // Cannot be both user-based and apply for all
  if (isUserBased && isApplyForAll) {
    throw new ApiError("Cannot be both user-based and apply for all users", 400);
  }

  // If targetUser is provided, verify user exists
  if (targetUser) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUser),
    });
    if (!user) {
      throw new ApiError("Target user not found", 404);
    }
  }

  // Get staff user ID from auth middleware
  const staffUserId = req.staffUser?.id;
  if (!staffUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  // Generate coupon code if not provided
  let finalCouponCode = couponCode;
  if (!finalCouponCode) {
    // Generate a unique coupon code
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    finalCouponCode = `MF${timestamp}${random}`;
  }

  // Check if coupon code already exists
  const existingCoupon = await db.query.coupons.findFirst({
    where: eq(coupons.couponCode, finalCouponCode),
  });

  if (existingCoupon) {
    throw new ApiError("Coupon code already exists", 400);
  }

  const result = await db.insert(coupons).values({
    couponCode: finalCouponCode,
    isUserBased: isUserBased || false,
    discountPercent: discountPercent?.toString(),
    flatDiscount: flatDiscount?.toString(),
    minOrder: minOrder?.toString(),
    targetUser,
    createdBy: staffUserId,
    maxValue: maxValue?.toString(),
    isApplyForAll: isApplyForAll || false,
    validTill: validTill ? new Date(validTill) : undefined,
    maxLimitForUser: maxLimitForUser,
  }).returning();

  res.status(201).json(result[0]);
};

/**
 * Get all coupons
 */
export const getCoupons = async (req: Request, res: Response) => {
  const result = await db.query.coupons.findMany({
    with: {
      targetUser: true,
      creator: true,
    },
    orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
  });

  res.json(result);
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const couponId = parseInt(id);

  if (isNaN(couponId)) {
    throw new ApiError("Invalid coupon ID", 400);
  }

  const result = await db.query.coupons.findFirst({
    where: eq(coupons.id, couponId),
    with: {
      targetUser: true,
      creator: true,
    },
  });

  if (!result) {
    throw new ApiError("Coupon not found", 404);
  }

  res.json(result);
};

/**
 * Update coupon
 */
export const updateCoupon = async (req: Request, res: Response) => {
  const { id } = req.params;
  const couponId = parseInt(id);
  const updates: Partial<CreateCouponBody & { isInvalidated?: boolean }> = req.body;

  if (isNaN(couponId)) {
    throw new ApiError("Invalid coupon ID", 400);
  }

  // Validation: ensure discount types are valid
  if (updates.discountPercent !== undefined && updates.flatDiscount !== undefined) {
    if (updates.discountPercent && updates.flatDiscount) {
      throw new ApiError("Cannot have both discountPercent and flatDiscount", 400);
    }
  }

  // If updating to user-based, targetUser is required
  if (updates.isUserBased && !updates.targetUser) {
    const existingCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, couponId),
    });
    if (!existingCoupon?.targetUser && !updates.targetUser) {
      throw new ApiError("targetUser is required for user-based coupons", 400);
    }
  }

  // If targetUser is provided, verify user exists
  if (updates.targetUser) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, updates.targetUser),
    });
    if (!user) {
      throw new ApiError("Target user not found", 404);
    }
  }

  const updateData: any = { ...updates };
  if (updates.discountPercent !== undefined) {
    updateData.discountPercent = updates.discountPercent?.toString();
  }
  if (updates.flatDiscount !== undefined) {
    updateData.flatDiscount = updates.flatDiscount?.toString();
  }
  if (updates.minOrder !== undefined) {
    updateData.minOrder = updates.minOrder?.toString();
  }
  if (updates.maxValue !== undefined) {
    updateData.maxValue = updates.maxValue?.toString();
  }

  const result = await db.update(coupons)
    .set(updateData)
    .where(eq(coupons.id, couponId))
    .returning();

  if (result.length === 0) {
    throw new ApiError("Coupon not found", 404);
  }

  res.json(result[0]);
};

/**
 * Delete coupon (soft delete by invalidating)
 */
export const deleteCoupon = async (req: Request, res: Response) => {
  const { id } = req.params;
  const couponId = parseInt(id);

  if (isNaN(couponId)) {
    throw new ApiError("Invalid coupon ID", 400);
  }

  const result = await db.update(coupons)
    .set({ isInvalidated: true })
    .where(eq(coupons.id, couponId))
    .returning();

  if (result.length === 0) {
    throw new ApiError("Coupon not found", 404);
  }

  res.json({ message: "Coupon invalidated successfully" });
};

/**
 * Validate coupon for use
 */
export const validateCoupon = async (req: Request, res: Response) => {
  const { code, userId, orderAmount } = req.body;

  if (!code || typeof code !== 'string') {
    return res.json({ valid: false, message: "Invalid coupon code" });
  }

  const coupon = await db.query.coupons.findFirst({
    where: and(
      eq(coupons.couponCode, code.toUpperCase()),
      eq(coupons.isInvalidated, false)
    ),
  });

  if (!coupon) {
    return res.json({ valid: false, message: "Coupon not found or invalidated" });
  }

  // Check expiry date
  if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
    return res.json({ valid: false, message: "Coupon has expired" });
  }

  // Check if user-based coupon is for the correct user
  if (coupon.isUserBased && coupon.targetUser !== userId) {
    return res.json({ valid: false, message: "Coupon not valid for this user" });
  }

  // Check if coupon applies to all users or specific user
  if (!coupon.isApplyForAll && !coupon.isUserBased) {
    return res.json({ valid: false, message: "Coupon is not available for use" });
  }

  // Check minimum order amount
  const minOrderValue = coupon.minOrder ? parseFloat(coupon.minOrder) : 0;
  if (minOrderValue > 0 && orderAmount < minOrderValue) {
    return res.json({ valid: false, message: `Minimum order amount is ${minOrderValue}` });
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountPercent) {
    const percent = parseFloat(coupon.discountPercent);
    discountAmount = (orderAmount * percent) / 100;
  } else if (coupon.flatDiscount) {
    discountAmount = parseFloat(coupon.flatDiscount);
  }

  // Apply max value limit
  const maxValueLimit = coupon.maxValue ? parseFloat(coupon.maxValue) : 0;
  if (maxValueLimit > 0 && discountAmount > maxValueLimit) {
    discountAmount = maxValueLimit;
  }

  res.json({
    valid: true,
    discountAmount,
    coupon: {
      id: coupon.id,
      discountPercent: coupon.discountPercent,
      flatDiscount: coupon.flatDiscount,
      maxValue: coupon.maxValue,
    }
  });
};