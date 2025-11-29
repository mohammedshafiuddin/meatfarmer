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
  orderItemId: number;
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
          })
        ),
        addressId: z.number().int().positive(),
        paymentMethod: z.enum(["online", "cod"]),
        couponIds: z.array(z.number().int().positive()).optional(),
        slotId: z.number().int().positive(),
        userNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { selectedItems, addressId, slotId, paymentMethod, couponIds, userNotes } =
        input;

      // Validate address belongs to user
      const address = await db.query.addresses.findFirst({
        where: and(eq(addresses.userId, userId), eq(addresses.id, addressId)),
      });
      if (!address) {
        throw new ApiError("Invalid address", 400);
      }

      // Calculate total and validate items
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: number;
        quantity: string;
        price: any;
        discountedPrice: string;
      }> = [];
      for (const item of selectedItems) {
        const product = await db.query.productInfo.findFirst({
          where: eq(productInfo.id, item.productId),
        });
        if (!product) {
          throw new ApiError(`Product ${item.productId} not found`, 400);
        }
        totalAmount += parseFloat(product.price.toString()) * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity.toString(),
          price: product.price,
          discountedPrice: product.price.toString(),
        });
      }

      // Early coupon validation (irrespective of products)
      let appliedCoupons: AppliedCoupon[] = [];
      if (couponIds && couponIds.length > 0) {
        const fetchedCoupons = await db.query.coupons.findMany({
          where: inArray(coupons.id, couponIds),
          with: {
            usages: { where: eq(couponUsage.userId, userId) },
            applicableUsers: true,
            applicableProducts: true,
          },
        });

        for (const coupon of fetchedCoupons) {
          if (!coupon) throw new ApiError("Invalid coupon", 400);
          if (coupon.isInvalidated) throw new ApiError("Coupon is no longer valid", 400);
          if (coupon.validTill && new Date(coupon.validTill) < new Date()) throw new ApiError("Coupon has expired", 400);
          const applicableUsers = coupon.applicableUsers || [];
          if (applicableUsers.length > 0 && !applicableUsers.some(au => au.userId === userId)) throw new ApiError("Coupon not applicable to this user", 400);
          if (coupon.maxLimitForUser && coupon.usages.length >= coupon.maxLimitForUser) throw new ApiError("Coupon usage limit exceeded", 400);
        }

        const exclusiveCoupons = fetchedCoupons.filter(c => c.exclusiveApply);
        if (exclusiveCoupons.length > 1) throw new ApiError("Only one exclusive coupon can be applied", 400);
        if (exclusiveCoupons.length === 1 && couponIds.length > 1) throw new ApiError("Exclusive coupon cannot be combined with other coupons", 400);

        appliedCoupons = fetchedCoupons;
      }

      // Validate min order
      if (appliedCoupons.length > 0) {
        for (const coupon of appliedCoupons) {
          if (coupon.minOrder && parseFloat(coupon.minOrder.toString()) > totalAmount) {
            throw new ApiError("Order amount does not meet coupon minimum requirement", 400);
          }
        }
      }

      // Calculate per-product discounted prices
      orderItemsData.forEach(itemData => {
        let itemDiscount = 0;
        const applicableCouponsForItem = appliedCoupons.filter(coupon => {
          const applicableProducts = Array.isArray(coupon.applicableProducts) ? coupon.applicableProducts : [];
          return applicableProducts.length === 0 || applicableProducts.some((ap: any) => ap.productId === itemData.productId);
        });

        applicableCouponsForItem.forEach(coupon => {
          if (coupon.discountPercent) {
            itemDiscount += Math.min(
              (parseFloat(itemData.price.toString()) * parseFloat(coupon.discountPercent.toString())) / 100,
              coupon.maxValue ? parseFloat(coupon.maxValue.toString()) : Infinity
            );
          }
        });

        itemData.discountedPrice = (parseFloat(itemData.price.toString()) - itemDiscount).toString();
      });
      orderItemsData.forEach(item => console.log(JSON.stringify(item)))
      let finalAmount = orderItemsData.reduce((sum, item) => sum + (parseFloat(item.discountedPrice)*(Number(item.quantity))), 0);
      console.log({finalAmount}, '1')
      
      // Apply flat discounts to the order total
      let flatDiscountAmount = 0;
      appliedCoupons.forEach(coupon => {
        if (coupon.flatDiscount) {
          flatDiscountAmount += Math.min(
            parseFloat(coupon.flatDiscount.toString()),
            coupon.maxValue ? parseFloat(coupon.maxValue.toString()) : finalAmount
          );
        }
      });
      finalAmount -= flatDiscountAmount;
      
      console.log({finalAmount}, '2')
       // Create order in transaction
       const newOrder = await db.transaction(async (tx) => {
         // Get and increment readable order ID
         let currentReadableId = 1;
         const existing = await tx.query.keyValStore.findFirst({
           where: eq(keyValStore.key, READABLE_ORDER_ID_KEY),
         });
         if (existing) {
           currentReadableId = (existing.value as { value: number }).value + 1;
         }
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

         let paymentInfoId: number | null = null;

         if (paymentMethod === "online") {
           // Create payment info for online payment
           const [paymentInfo] = await tx
             .insert(paymentInfoTable)
             .values({
               status: "pending",
               gateway: "razorpay", // or whatever
               merchantOrderId: `order_${Date.now()}`, // generate unique
               // other fields as needed
             })
             .returning();
           paymentInfoId = paymentInfo.id;
         }

         const [order] = await tx
           .insert(orders)
           .values({
             userId,
             addressId,
             slotId,
             isCod: paymentMethod === "cod",
             isOnlinePayment: paymentMethod === "online",
             paymentInfoId,
             totalAmount: finalAmount.toString(),
             readableId: currentReadableId,
             userNotes: userNotes || null,
           })
           .returning();

         for (const item of orderItemsData) {
           await tx.insert(orderItems).values({
             orderId: order.id,
             ...item,
           });
         }

         try {

           await tx.insert(orderStatus).values({
             userId,
             orderId: order.id,
             paymentStatus: paymentMethod === 'cod' ? 'cod' : 'pending',
             // no payment fields here
           });
         }
         catch(e) {
           console.log(e)

         }

          // Insert payment record for online payment
          if (paymentMethod === "online") {
            const razorpayOrder = await RazorpayPaymentService.createOrder(order.id, finalAmount.toString());
            await RazorpayPaymentService.insertPaymentRecord(order.id, razorpayOrder, tx);
          }

         // Remove ordered items from cart
         await tx.delete(cartItems).where(
           and(
             eq(cartItems.userId, userId),
             inArray(cartItems.productId, selectedItems.map(item => item.productId))
           )
         );

         return order;
       });

        // Add coupon usage records if coupons were applied
        if (appliedCoupons.length > 0) {
          // Get inserted order items
          const insertedOrderItems = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, newOrder.id),
          });

          const couponUsageInserts: CouponUsageInsert[] = [];
        appliedCoupons.forEach(coupon => {
          insertedOrderItems.forEach(orderItem => {
            const applicableProducts = Array.isArray(coupon.applicableProducts) ? coupon.applicableProducts : [];
            if (applicableProducts.length === 0 || applicableProducts.some((ap: any) => ap.productId === orderItem.productId)) {
                couponUsageInserts.push({
                  userId,
                  couponId: coupon.id,
                  orderId: newOrder.id,
                  orderItemId: orderItem.id,
                  usedAt: new Date(),
                });
              }
            });
          });

          if (couponUsageInserts.length > 0) {
            await db.insert(couponUsage).values(couponUsageInserts);
          }
        }

      sendOrderPlacedNotification(userId, newOrder.id.toString());

      return { success: true, data: newOrder };
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
          orderStatus: true,
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


