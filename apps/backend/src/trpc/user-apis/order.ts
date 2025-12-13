import { router, protectedProcedure } from "../trpc-index";
import { z } from "zod";
import { db } from "../../db/db_index";
import {
  orders,
  orderItems,
  orderStatus,
  addresses,
  productInfo,
  paymentInfoTable,
  keyValStore,
  coupons,
  couponUsage,
  payments,
  cartItems,
  refunds,
} from "../../db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { READABLE_ORDER_ID_KEY } from "../../lib/const-strings";
import { generateSignedUrlsFromS3Urls } from "../../lib/s3-client";
import { ApiError } from "../../lib/api-error";
import { sendOrderPlacedNotification, sendOrderCancelledNotification } from "../../lib/notif-job";
import { RazorpayPaymentService } from "../../lib/payments-utils";

type AppliedCoupon = typeof coupons.$inferSelect & {
  usages: (typeof couponUsage.$inferSelect)[];
  applicableUsers: { userId: number }[];
  applicableProducts: { productId: number }[];
};

type CouponUsageInsert = {
  userId: number;
  couponId: number;
  orderId: number;
  orderItemId: number | null;
  usedAt: Date;
};

// Coupon stacking validation function
const validateCouponStacking = async (couponIds: number[], orderAmount: number) => {
  const fetchedCoupons = await db.query.coupons.findMany({
    where: inArray(coupons.id, couponIds),
  });

  // Rule 3: Total discount cannot exceed 50% of order amount
  const totalDiscount = fetchedCoupons.reduce((total, coupon) => {
    const discount = coupon.discountPercent
      ? (orderAmount * parseFloat(coupon.discountPercent.toString())) / 100
      : coupon.flatDiscount
      ? parseFloat(coupon.flatDiscount.toString())
      : 0;
    return total + discount;
  }, 0);
  
  if (totalDiscount > orderAmount * 0.5) {
    throw new Error("Total discount cannot exceed 50% of order amount");
  }
  
  // Rule 4: No duplicate coupons
  if (new Set(couponIds).size !== couponIds.length) {
    throw new Error("Duplicate coupons cannot be applied");
  }

  // Rule 5: Exclusive coupon validation
  const exclusiveCoupons = fetchedCoupons.filter(c => c.exclusiveApply);
  if (exclusiveCoupons.length > 1) {
    throw new Error("Only one exclusive coupon can be applied");
  }
  if (exclusiveCoupons.length === 1 && couponIds.length > 1) {
    throw new Error("Exclusive coupon cannot be combined with other coupons");
  }

  return true;
};

export const orderRouter = router({
  placeOrder: protectedProcedure
    .input(
      z.object({
        selectedItems: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive(),
            slotId: z.number().int().positive(),
          })
        ),
        addressId: z.number().int().positive(),
        paymentMethod: z.enum(["online", "cod"]),
        couponId: z.number().int().positive().optional(),
        userNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { selectedItems, addressId, paymentMethod, couponId, userNotes } = input;

      // Validate address belongs to user
      const address = await db.query.addresses.findFirst({
        where: and(eq(addresses.userId, userId), eq(addresses.id, addressId)),
      });
      if (!address) {
        throw new ApiError("Invalid address", 400);
      }

      // Group items by slotId and validate products
      const ordersBySlot = new Map<number, Array<{
        productId: number;
        quantity: number;
        slotId: number;
        product: any;
      }>>();

      for (const item of selectedItems) {
        const product = await db.query.productInfo.findFirst({
          where: eq(productInfo.id, item.productId),
        });
        if (!product) {
          throw new ApiError(`Product ${item.productId} not found`, 400);
        }

        if (!ordersBySlot.has(item.slotId)) {
          ordersBySlot.set(item.slotId, []);
        }
        ordersBySlot.get(item.slotId)!.push({ ...item, product });
      }

      // Validate single coupon if provided
      let appliedCoupon = null;
      if (couponId) {
        const coupon = await db.query.coupons.findFirst({
          where: eq(coupons.id, couponId),
          with: {
            usages: { where: eq(couponUsage.userId, userId) },
          },
        });

        if (!coupon) throw new ApiError("Invalid coupon", 400);
        if (coupon.isInvalidated) throw new ApiError("Coupon is no longer valid", 400);
        if (coupon.validTill && new Date(coupon.validTill) < new Date()) throw new ApiError("Coupon has expired", 400);
        if (coupon.maxLimitForUser && coupon.usages.length >= coupon.maxLimitForUser) throw new ApiError("Coupon usage limit exceeded", 400);

        appliedCoupon = coupon;
      }

      // Calculate total amount across all orders
      let totalAmount = 0;
      for (const [slotId, items] of ordersBySlot) {
        const orderTotal = items.reduce((sum, item) =>
          sum + (parseFloat(item.product.price.toString()) * item.quantity), 0);
        totalAmount += orderTotal;
      }

      // Validate minimum order for coupon
      if (appliedCoupon && appliedCoupon.minOrder && parseFloat(appliedCoupon.minOrder.toString()) > totalAmount) {
        throw new ApiError("Order amount does not meet coupon minimum requirement", 400);
      }

      // Create orders in transaction
      const createdOrders = await db.transaction(async (tx) => {
        // Get and increment readable order ID counter
        let currentReadableId = 1;
        const existing = await tx.query.keyValStore.findFirst({
          where: eq(keyValStore.key, READABLE_ORDER_ID_KEY),
        });
        if (existing) {
          currentReadableId = (existing.value as { value: number }).value + 1;
        }

        // Create shared payment info for all orders
        let sharedPaymentInfoId: number | null = null;
        if (paymentMethod === "online") {
          const [paymentInfo] = await tx
            .insert(paymentInfoTable)
            .values({
              status: "pending",
              gateway: "razorpay",
              merchantOrderId: `multi_order_${Date.now()}`,
            })
            .returning();
          sharedPaymentInfoId = paymentInfo.id;
        }

        const createdOrders: any[] = [];

        // Create separate order for each slot group
        for (const [slotId, items] of ordersBySlot) {
          // Calculate order-specific total
          const orderTotal = items.reduce((sum, item) =>
            sum + (parseFloat(item.product.price.toString()) * item.quantity), 0);

          // Apply coupon discount proportionally (split across orders)
          let finalOrderTotal = orderTotal;
          if (appliedCoupon) {
            const proportion = orderTotal / totalAmount;
            if (appliedCoupon.discountPercent) {
              const discount = Math.min(
                (orderTotal * parseFloat(appliedCoupon.discountPercent.toString())) / 100,
                appliedCoupon.maxValue ? (parseFloat(appliedCoupon.maxValue.toString()) * proportion) : Infinity
              );
              finalOrderTotal -= discount;
            } else if (appliedCoupon.flatDiscount) {
              const discount = Math.min(
                parseFloat(appliedCoupon.flatDiscount.toString()) * proportion,
                appliedCoupon.maxValue ? (parseFloat(appliedCoupon.maxValue.toString()) * proportion) : finalOrderTotal
              );
              finalOrderTotal -= discount;
            }
          }

          // Create order record
          const [order] = await tx
            .insert(orders)
            .values({
              userId,
              addressId,
              slotId,
              isCod: paymentMethod === "cod",
              isOnlinePayment: paymentMethod === "online",
              paymentInfoId: sharedPaymentInfoId,
              totalAmount: finalOrderTotal.toString(),
              readableId: currentReadableId++,
              userNotes: userNotes || null,
            })
            .returning();

          // Create order items
          const orderItemsData = items.map(item => ({
            orderId: order.id as number,
            productId: item.productId,
            quantity: item.quantity.toString(),
            price: item.product.price,
            discountedPrice: item.product.price.toString(),
          }));

          await tx.insert(orderItems).values(orderItemsData);

          // Create order status
          await tx.insert(orderStatus).values({
            userId,
            orderId: order.id as number,
            paymentStatus: paymentMethod === 'cod' ? 'cod' : 'pending',
          });

          createdOrders.push(order);
        }

        // Update readable ID counter
        await tx
          .insert(keyValStore)
          .values({
            key: READABLE_ORDER_ID_KEY,
            value: { value: currentReadableId },
          })
          .onConflictDoUpdate({
            target: keyValStore.key,
            set: { value: { value: currentReadableId } },
          });

        // Create Razorpay order for online payments
        if (paymentMethod === "online" && sharedPaymentInfoId) {
          const razorpayOrder = await RazorpayPaymentService.createOrder(sharedPaymentInfoId, totalAmount.toString());
          await RazorpayPaymentService.insertPaymentRecord(sharedPaymentInfoId, razorpayOrder, tx);
        }

        // Remove ordered items from cart
        await tx.delete(cartItems).where(
          and(
            eq(cartItems.userId, userId),
            inArray(cartItems.productId, selectedItems.map(item => item.productId))
          )
        );

        return createdOrders;
      });

      // Record single coupon usage if applied (regardless of number of orders)
      if (appliedCoupon && createdOrders.length > 0) {
        await db.insert(couponUsage).values({
          userId,
          couponId: appliedCoupon.id,
          orderId: createdOrders[0].id as number, // Use first order ID
          orderItemId: null,
          usedAt: new Date(),
        });
      }

      // Send notifications for each order
      for (const order of createdOrders) {
        sendOrderPlacedNotification(userId, order.id.toString());
      }

      return { success: true, data: createdOrders };
    }),

  getOrders: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { page = 1, pageSize = 10 } = input || {};
      const userId = ctx.user.userId;
      const offset = (page - 1) * pageSize;

      // Get total count for pagination
      const totalCountResult = await db.$count(orders, eq(orders.userId, userId));
      const totalCount = totalCountResult;

       const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        with: {
          orderItems: {
            with: {
              product: true,
            },
          },
          slot: true,
          paymentInfo: true,
          orderStatus: true,
          refunds: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        limit: pageSize,
        offset: offset,
      });

    const mappedOrders = await Promise.all(
      userOrders.map(async (order) => {
        const status = order.orderStatus[0]; // assuming one status per order
        const refund = order.refunds[0]; // assuming one refund per order
        const deliveryStatus = status?.isCancelled
          ? "cancelled"
          : status?.isDelivered
          ? "success"
          : "pending";
        const orderStatus = status?.isCancelled ? "cancelled" : "success";
        const paymentMode = order.isCod ? "CoD" : "Online";
        const paymentStatus = status?.paymentStatus || "pending";
        const refundStatus = refund?.refundStatus || 'none';
        const refundAmount = refund?.refundAmount ? parseFloat(refund.refundAmount.toString()) : null;

        const items = await Promise.all(
          order.orderItems.map(async (item) => {
            const signedImages = item.product.images
              ? await generateSignedUrlsFromS3Urls(
                  item.product.images as string[]
                )
              : [];
            return {
              productName: item.product.name,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price.toString()),
              discountedPrice: parseFloat(item.discountedPrice?.toString() || item.price.toString()),
              amount:
                parseFloat(item.price.toString()) * parseFloat(item.quantity),
              image: signedImages[0] || null,
            };
          })
        );

        return {
          id: order.id,
          orderId: `ORD${order.readableId.toString().padStart(3, "0")}`,
          orderDate: order.createdAt.toISOString(),
          deliveryStatus,
          deliveryDate: order.slot?.deliveryTime.toISOString(),
          orderStatus,
          cancelReason: status?.cancelReason || null,
          paymentMode,
          totalAmount: Number(order.totalAmount),
          paymentStatus,
          refundStatus,
          refundAmount,
          userNotes: order.userNotes || null,
          items,
        };
      })
    );

    return {
      success: true,
      data: mappedOrders,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    };
  }),

  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { orderId } = input;
      const userId = ctx.user.userId;

       const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, parseInt(orderId)), eq(orders.userId, userId)),
        with: {
          orderItems: {
            with: {
              product: true,
            },
          },
          slot: true,
          paymentInfo: true,
          orderStatus: {
            with: {
              refundCoupon: true,
            },
          },
          refunds: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Get coupon usage for this specific order using new orderId field
      const couponUsageData = await db.query.couponUsage.findMany({
        where: eq(couponUsage.orderId, order.id), // Use new orderId field
        with: {
          coupon: true,
        },
      });

      let couponData = null;
      if (couponUsageData.length > 0) {
        // Calculate total discount from multiple coupons
        let totalDiscountAmount = 0;
        const orderTotal = parseFloat(order.totalAmount.toString());
        
        for (const usage of couponUsageData) {
          let discountAmount = 0;
          
          if (usage.coupon.discountPercent) {
            discountAmount = (orderTotal * parseFloat(usage.coupon.discountPercent.toString())) / 100;
          } else if (usage.coupon.flatDiscount) {
            discountAmount = parseFloat(usage.coupon.flatDiscount.toString());
          }

          // Apply max value limit if set
          if (usage.coupon.maxValue && discountAmount > parseFloat(usage.coupon.maxValue.toString())) {
            discountAmount = parseFloat(usage.coupon.maxValue.toString());
          }

          totalDiscountAmount += discountAmount;
        }

        couponData = {
          couponCode: couponUsageData.map(u => u.coupon.couponCode).join(', '),
          couponDescription: `${couponUsageData.length} coupons applied`,
          discountAmount: totalDiscountAmount,
        };
      }

      const status = order.orderStatus[0]; // assuming one status per order
      const refund = order.refunds[0]; // assuming one refund per order
      const deliveryStatus = status?.isCancelled
        ? "cancelled"
        : status?.isDelivered
        ? "success"
        : "pending";
      const orderStatus = status?.isCancelled ? "cancelled" : "success";
      const paymentMode = order.isCod ? "CoD" : "Online";
      const paymentStatus = status?.paymentStatus || "pending";
      const refundStatus = refund?.refundStatus || 'none';
      const refundAmount = refund?.refundAmount ? parseFloat(refund.refundAmount.toString()) : null;

      const items = await Promise.all(
        order.orderItems.map(async (item) => {
          const signedImages = item.product.images
            ? await generateSignedUrlsFromS3Urls(
                item.product.images as string[]
              )
            : [];
           return {
             productName: item.product.name,
             quantity: parseFloat(item.quantity),
             price: parseFloat(item.price.toString()),
             discountedPrice: parseFloat(item.discountedPrice?.toString() || item.price.toString()),
             amount:
               parseFloat(item.price.toString()) * parseFloat(item.quantity),
             image: signedImages[0] || null,
           };
        })
      );

      return {
        id: order.id,
        orderId: `ORD${order.readableId.toString().padStart(3, "0")}`,
        orderDate: order.createdAt.toISOString(),
        deliveryStatus,
        deliveryDate: order.slot?.deliveryTime.toISOString(),
        orderStatus,
        cancelReason: status?.cancelReason || null,
        paymentMode,
        paymentStatus,
        refundStatus,
        refundAmount,
        userNotes: order.userNotes || null,
        items,
        couponCode: couponData?.couponCode || null,
        couponDescription: couponData?.couponDescription || null,
        discountAmount: couponData?.discountAmount || null,
        orderAmount: parseFloat(order.totalAmount.toString()),
      };
    }),

  cancelOrder: protectedProcedure
    .input(
      z.object({
        id: z.string().regex(/^ORD\d+$/, "Invalid order ID format"),
        reason: z.string().min(1, "Cancellation reason is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { id, reason } = input;

      // Extract readable ID from orderId (e.g., ORD001 -> 1)
      const readableIdMatch = id.match(/^ORD(\d+)$/);
      if (!readableIdMatch) {
        console.error("Invalid order ID format:", id);
        throw new ApiError("Invalid order ID format", 400);
      }
      const readableId = parseInt(readableIdMatch[1]);

      // Check if order exists and belongs to user
      const order = await db.query.orders.findFirst({
        where: eq(orders.readableId, readableId),
        with: {
          orderStatus: true,
        },
      });

      if (!order) {
        console.error("Order not found:", id);
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId) {
        console.error("Order does not belong to user:", {
          orderId: id,
          orderUserId: order.userId,
          requestUserId: userId,
        });
        throw new ApiError("Order not found", 404);
      }

      const status = order.orderStatus[0];
      if (!status) {
        console.error("Order status not found for order:", id);
        throw new ApiError("Order status not found", 400);
      }

      if (status.isCancelled) {
        console.error("Order is already cancelled:", id);
        throw new ApiError("Order is already cancelled", 400);
      }

      if (status.isDelivered) {
        console.error("Cannot cancel delivered order:", id);
        throw new ApiError("Cannot cancel delivered order", 400);
      }

        // Perform database operations in transaction
        const result = await db.transaction(async (tx) => {
          // Update order status
          await tx
            .update(orderStatus)
            .set({
              isCancelled: true,
              cancelReason: reason,
              cancellationUserNotes: reason,
              cancellationReviewed: false,
            })
            .where(eq(orderStatus.id, status.id));

          // Determine refund status based on payment method
          const refundStatus = order.isCod ? 'na' : 'pending';

          // Insert refund record
          await tx.insert(refunds).values({
            orderId: order.id,
            refundStatus,
          });

          return { orderId: order.id, userId };
        });

       // Send notification outside transaction (idempotent operation)
       await sendOrderCancelledNotification(result.userId, result.orderId.toString());

      return { success: true, message: "Order cancelled successfully" };
     }),

     updateUserNotes: protectedProcedure
       .input(
         z.object({
           id: z.string().regex(/^ORD\d+$/, "Invalid order ID format"),
           userNotes: z.string(),
         })
       )
       .mutation(async ({ input, ctx }) => {
         const userId = ctx.user.userId;
         const { id, userNotes } = input;


         // Extract readable ID from orderId (e.g., ORD001 -> 1)
         const readableIdMatch = id.match(/^ORD(\d+)$/);
         if (!readableIdMatch) {
           console.error("Invalid order ID format:", id);
           throw new ApiError("Invalid order ID format", 400);
         }
         const readableId = parseInt(readableIdMatch[1]);

         // Check if order exists and belongs to user
         const order = await db.query.orders.findFirst({
           where: eq(orders.readableId, readableId),
           with: {
             orderStatus: true,
           },
         });

         if (!order) {
           console.error("Order not found:", id);
           throw new ApiError("Order not found", 404);
         }

         if (order.userId !== userId) {
           console.error("Order does not belong to user:", {
             orderId: id,
             orderUserId: order.userId,
             requestUserId: userId,
           });
           throw new ApiError("Order not found", 404);
         }

         const status = order.orderStatus[0];
         if (!status) {
           console.error("Order status not found for order:", id);
           throw new ApiError("Order status not found", 400);
         }

         // Only allow updating notes for orders that are not delivered or cancelled
         if (status.isDelivered) {
           console.error("Cannot update notes for delivered order:", id);
           throw new ApiError("Cannot update notes for delivered order", 400);
         }

         if (status.isCancelled) {
           console.error("Cannot update notes for cancelled order:", id);
           throw new ApiError("Cannot update notes for cancelled order", 400);
         }

         // Update user notes
         await db
           .update(orders)
           .set({
             userNotes: userNotes || null,
           })
           .where(eq(orders.id, order.id));

         return { success: true, message: "Notes updated successfully" };
       }),
 });


