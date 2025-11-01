import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { coupons, users, staffUsers, orders } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const createCouponBodySchema = z.object({
  couponCode: z.string().optional(),
  isUserBased: z.boolean().optional(),
  discountPercent: z.number().optional(),
  flatDiscount: z.number().optional(),
  minOrder: z.number().optional(),
  targetUser: z.number().optional(),
  productIds: z.array(z.number()).optional(),
  maxValue: z.number().optional(),
  isApplyForAll: z.boolean().optional(),
  validTill: z.string().optional(),
  maxLimitForUser: z.number().optional(),
});

const validateCouponBodySchema = z.object({
  code: z.string(),
  userId: z.number(),
  orderAmount: z.number(),
});

export const couponRouter = router({
  create: publicProcedure
    .input(createCouponBodySchema)
    .mutation(async ({ input, ctx }) => {
      const { couponCode, isUserBased, discountPercent, flatDiscount, minOrder, targetUser, productIds, maxValue, isApplyForAll, validTill, maxLimitForUser } = input;

      // Validation: ensure at least one discount type is provided
      if ((!discountPercent && !flatDiscount) || (discountPercent && flatDiscount)) {
        throw new Error("Either discountPercent or flatDiscount must be provided (but not both)");
      }

      // If user-based, targetUser is required (unless it's apply for all)
      if (isUserBased && !targetUser && !isApplyForAll) {
        throw new Error("targetUser is required for user-based coupons (or set isApplyForAll to true)");
      }

      // Cannot be both user-based and apply for all
      if (isUserBased && isApplyForAll) {
        throw new Error("Cannot be both user-based and apply for all users");
      }

      // If targetUser is provided, verify user exists
      if (targetUser) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, targetUser),
        });
        if (!user) {
          throw new Error("Target user not found");
        }
      }

      // Get staff user ID from auth middleware
      const staffUserId = ctx.staffUser?.id;
      if (!staffUserId) {
        throw new Error("Unauthorized");
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
        throw new Error("Coupon code already exists");
      }

      const result = await db.insert(coupons).values({
        couponCode: finalCouponCode,
        isUserBased: isUserBased || false,
        discountPercent: discountPercent?.toString(),
        flatDiscount: flatDiscount?.toString(),
        minOrder: minOrder?.toString(),
        targetUser,
        productIds: productIds || null,
        createdBy: staffUserId,
        maxValue: maxValue?.toString(),
        isApplyForAll: isApplyForAll || false,
        validTill: validTill ? new Date(validTill) : undefined,
        maxLimitForUser: maxLimitForUser,
      }).returning();

      return result[0];
    }),

  getAll: publicProcedure
    .query(async () => {
      const result = await db.query.coupons.findMany({
        with: {
          targetUser: true,
          creator: true,
        },
        orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
      });

      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const couponId = input.id;

      const result = await db.query.coupons.findFirst({
        where: eq(coupons.id, couponId),
        with: {
          targetUser: true,
          creator: true,
        },
      });

      if (!result) {
        throw new Error("Coupon not found");
      }

      return result;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      updates: createCouponBodySchema.extend({
        isInvalidated: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { id, updates } = input;

      // Validation: ensure discount types are valid
      if (updates.discountPercent !== undefined && updates.flatDiscount !== undefined) {
        if (updates.discountPercent && updates.flatDiscount) {
          throw new Error("Cannot have both discountPercent and flatDiscount");
        }
      }

      // If updating to user-based, targetUser is required
      if (updates.isUserBased && !updates.targetUser) {
        const existingCoupon = await db.query.coupons.findFirst({
          where: eq(coupons.id, id),
        });
        if (!existingCoupon?.targetUser && !updates.targetUser) {
          throw new Error("targetUser is required for user-based coupons");
        }
      }

      // If targetUser is provided, verify user exists
      if (updates.targetUser) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, updates.targetUser),
        });
        if (!user) {
          throw new Error("Target user not found");
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
        .where(eq(coupons.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Coupon not found");
      }

      return result[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const result = await db.update(coupons)
        .set({ isInvalidated: true })
        .where(eq(coupons.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Coupon not found");
      }

      return { message: "Coupon invalidated successfully" };
    }),

  validate: publicProcedure
    .input(validateCouponBodySchema)
    .query(async ({ input }) => {
      const { code, userId, orderAmount } = input;

      if (!code || typeof code !== 'string') {
        return { valid: false, message: "Invalid coupon code" };
      }

      const coupon = await db.query.coupons.findFirst({
        where: and(
          eq(coupons.couponCode, code.toUpperCase()),
          eq(coupons.isInvalidated, false)
        ),
      });

      if (!coupon) {
        return { valid: false, message: "Coupon not found or invalidated" };
      }

      // Check expiry date
      if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
        return { valid: false, message: "Coupon has expired" };
      }

      // Check if user-based coupon is for the correct user
      if (coupon.isUserBased && coupon.targetUser !== userId) {
        return { valid: false, message: "Coupon not valid for this user" };
      }

      // Check if coupon applies to all users or specific user
      if (!coupon.isApplyForAll && !coupon.isUserBased) {
        return { valid: false, message: "Coupon is not available for use" };
      }

      // Check minimum order amount
      const minOrderValue = coupon.minOrder ? parseFloat(coupon.minOrder) : 0;
      if (minOrderValue > 0 && orderAmount < minOrderValue) {
        return { valid: false, message: `Minimum order amount is ${minOrderValue}` };
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

       return {
         valid: true,
         discountAmount,
         coupon: {
           id: coupon.id,
           discountPercent: coupon.discountPercent,
           flatDiscount: coupon.flatDiscount,
           maxValue: coupon.maxValue,
         }
       };
     }),

     generateCancellationCoupon: publicProcedure
       .input(
         z.object({
           orderId: z.string().regex(/^ORD\d+$/, "Invalid order ID format"),
         })
       )
       .mutation(async ({ input, ctx }) => {
         const { orderId } = input;

         // Get staff user ID from auth middleware
         const staffUserId = ctx.staffUser?.id;
         if (!staffUserId) {
           throw new Error("Unauthorized");
         }

         // Extract readable ID from orderId (e.g., ORD001 -> 1)
         const readableIdMatch = orderId.match(/^ORD(\d+)$/);
         if (!readableIdMatch) {
           throw new Error("Invalid order ID format");
         }
         const readableId = parseInt(readableIdMatch[1]);

         // Find the order with user and order status information
         const order = await db.query.orders.findFirst({
           where: eq(orders.readableId, readableId),
           with: {
             user: true,
             orderStatus: true,
           },
         });

         if (!order) {
           throw new Error("Order not found");
         }

         // Check if order is cancelled (check if any status entry has isCancelled: true)
         const isOrderCancelled = order.orderStatus?.some(status => status.isCancelled) || false;
         if (!isOrderCancelled) {
           throw new Error("Order is not cancelled");
         }

         // Check if payment method is COD
         if (order.isCod) {
           throw new Error("Can't generate refund coupon for CoD Order");
         }

         // Verify user exists
         if (!order.user) {
           throw new Error("User not found for this order");
         }

         // Generate coupon code: first 3 letters of user name + orderId
         const userNamePrefix = order.user.name.substring(0, 3).toUpperCase();
         const couponCode = `${userNamePrefix}${orderId}`;

         // Check if coupon code already exists
         const existingCoupon = await db.query.coupons.findFirst({
           where: eq(coupons.couponCode, couponCode),
         });

         if (existingCoupon) {
           throw new Error("Coupon code already exists");
         }

         // Get order total amount
         const orderAmount = parseFloat(order.totalAmount);

         // Calculate expiry date (30 days from now)
         const expiryDate = new Date();
         expiryDate.setDate(expiryDate.getDate() + 30);

         // Create the coupon
         const result = await db.insert(coupons).values({
           couponCode,
           isUserBased: true,
           flatDiscount: orderAmount.toString(),
           minOrder: "0",
           targetUser: order.userId,
           maxValue: orderAmount.toString(),
           validTill: expiryDate,
           maxLimitForUser: 1,
           createdBy: staffUserId,
           isApplyForAll: false,
         }).returning();

         return result[0];
       }),
 });