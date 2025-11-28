import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderItems, orderStatus, users, addresses, productInfo, units, deliverySlotInfo, payments, paymentInfoTable, orderCancellationsTable, coupons, couponUsage } from '../../db/schema';
import { eq, and, gte, lt, desc, SQL } from 'drizzle-orm';
import dayjs from 'dayjs';
import { sendOrderPackagedNotification, sendOrderDeliveredNotification } from '../../lib/notif-job';

const updateOrderNotesSchema = z.object({
  orderId: z.number(),
  adminNotes: z.string(),
});

const getFullOrderSchema = z.object({
  orderId: z.number(),
});

const getOrderDetailsSchema = z.object({
  orderId: z.number(),
});

const updatePackagedSchema = z.object({
  orderId: z.string(),
  isPackaged: z.boolean(),
});

const updateDeliveredSchema = z.object({
  orderId: z.string(),
  isDelivered: z.boolean(),
});

const getSlotOrdersSchema = z.object({
  slotId: z.string(),
});

const getTodaysOrdersSchema = z.object({
  slotId: z.string().optional(),
});

const getAllOrdersSchema = z.object({
  cursor: z.number().optional(),
  limit: z.number().default(20),
  slotId: z.number().optional().nullable(),
  packagedFilter: z.enum(['all', 'packaged', 'not_packaged']).optional().default('all'),
  deliveredFilter: z.enum(['all', 'delivered', 'not_delivered']).optional().default('all'),
  cancellationFilter: z.enum(['all', 'cancelled', 'not_cancelled']).optional().default('all'),
});

export const orderRouter = router({
  updateNotes: protectedProcedure
    .input(updateOrderNotesSchema)
    .mutation(async ({ input }) => {
      const { orderId, adminNotes } = input;

      const result = await db.update(orders)
        .set({
          adminNotes: adminNotes || null,
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Order not found");
      }

      return result[0];
    }),

  getFullOrder: protectedProcedure
    .input(getFullOrderSchema)
    .query(async ({ input }) => {
      const { orderId } = input;

      const orderData = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          user: true,
          address: true,
          slot: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          payment: true,
          paymentInfo: true,
        },
      });

      if (!orderData) {
        throw new Error("Order not found");
      }

       // Get order status separately
       const statusRecord = await db.query.orderStatus.findFirst({
         where: eq(orderStatus.orderId, orderId),
       });

       let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
       if (statusRecord?.isCancelled) {
         status = 'cancelled';
       } else if (statusRecord?.isDelivered) {
         status = 'delivered';
       }

       // Get cancellation details if order is cancelled
      let cancellation = null;
      if (status === 'cancelled') {
        cancellation = await db.query.orderCancellationsTable.findFirst({
          where: eq(orderCancellationsTable.orderId, orderId),
        });
      }

      return {
        id: orderData.id,
        readableId: orderData.readableId,
        customerName: `${orderData.user.name}`,
        customerEmail: orderData.user.email,
        customerMobile: orderData.user.mobile,
        address: {
          line1: orderData.address.addressLine1,
          line2: orderData.address.addressLine2,
          city: orderData.address.city,
          state: orderData.address.state,
          pincode: orderData.address.pincode,
          phone: orderData.address.phone,
        },
        slotInfo: orderData.slot ? {
          time: orderData.slot.deliveryTime,
          sequence: orderData.slot.deliverySequence,
        } : null,
        isCod: orderData.isCod,
        isOnlinePayment: orderData.isOnlinePayment,
        totalAmount: orderData.totalAmount,
        adminNotes: orderData.adminNotes,
        userNotes: orderData.userNotes,
        createdAt: orderData.createdAt,
        status,
        isPackaged: statusRecord?.isPackaged || false,
        isDelivered: statusRecord?.isDelivered || false,
        items: orderData.orderItems.map(item => ({
          id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.product.unit?.shortNotation,
          amount: parseFloat(item.price.toString()) * parseFloat(item.quantity || '0'),
        })),
        payment: orderData.payment ? {
          status: orderData.payment.status,
          gateway: orderData.payment.gateway,
          merchantOrderId: orderData.payment.merchantOrderId,
        } : null,
        paymentInfo: orderData.paymentInfo ? {
          status: orderData.paymentInfo.status,
          gateway: orderData.paymentInfo.gateway,
          merchantOrderId: orderData.paymentInfo.merchantOrderId,
        } : null,
        // Cancellation details (only present for cancelled orders)
        cancelReason: statusRecord?.cancelReason || null,
        cancellationReviewed: cancellation?.cancellationReviewed || false,
        isRefundDone: cancellation?.refundStatus === 'processed' || false,
      };
    }),

  getOrderDetails: protectedProcedure
    .input(getOrderDetailsSchema)
    .query(async ({ input }) => {
      const { orderId } = input;

      // Single optimized query with all relations
      const orderData = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          user: true,
          address: true,
          slot: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          payment: true,
          paymentInfo: true,
          orderStatus: true,        // Include in main query
          orderCancellations: true, // Include in main query
        },
      });

      if (!orderData) {
        throw new Error("Order not found");
      }

      // Get coupon usage for this specific order using new orderId field
      const couponUsageData = await db.query.couponUsage.findMany({
        where: eq(couponUsage.orderId, orderData.id), // Use new orderId field
        with: {
          coupon: true,
        },
      });

      let couponData = null;
      if (couponUsageData.length > 0) {
        // Calculate total discount from multiple coupons
        let totalDiscountAmount = 0;
        const orderTotal = parseFloat(orderData.totalAmount.toString());
        
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

       // Status determination from included relation
       const statusRecord = orderData.orderStatus?.[0];
       let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
       if (statusRecord?.isCancelled) {
         status = 'cancelled';
       } else if (statusRecord?.isDelivered) {
         status = 'delivered';
       }

       // Always include cancellation data (will be null/undefined if not cancelled)
      const cancellation = orderData.orderCancellations?.[0];

      return {
        id: orderData.id,
        readableId: orderData.readableId,
        customerName: `${orderData.user.name}`,
        customerEmail: orderData.user.email,
        customerMobile: orderData.user.mobile,
        address: {
          line1: orderData.address.addressLine1,
          line2: orderData.address.addressLine2,
          city: orderData.address.city,
          state: orderData.address.state,
          pincode: orderData.address.pincode,
          phone: orderData.address.phone,
        },
        slotInfo: orderData.slot ? {
          time: orderData.slot.deliveryTime,
          sequence: orderData.slot.deliverySequence,
        } : null,
        isCod: orderData.isCod,
        isOnlinePayment: orderData.isOnlinePayment,
        totalAmount: orderData.totalAmount,
        adminNotes: orderData.adminNotes,
        userNotes: orderData.userNotes,
        createdAt: orderData.createdAt,
        status,
        isPackaged: statusRecord?.isPackaged || false,
        isDelivered: statusRecord?.isDelivered || false,
        items: orderData.orderItems.map(item => ({
          id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.product.unit?.shortNotation,
          amount: parseFloat(item.price.toString()) * parseFloat(item.quantity || '0'),
        })),
        payment: orderData.payment ? {
          status: orderData.payment.status,
          gateway: orderData.payment.gateway,
          merchantOrderId: orderData.payment.merchantOrderId,
        } : null,
        paymentInfo: orderData.paymentInfo ? {
          status: orderData.paymentInfo.status,
          gateway: orderData.paymentInfo.gateway,
          merchantOrderId: orderData.paymentInfo.merchantOrderId,
        } : null,
        // Cancellation details (always included, null if not cancelled)
         cancelReason: statusRecord?.cancelReason || null,
         cancellationReviewed: cancellation?.cancellationReviewed || false,
         isRefundDone: cancellation?.refundStatus === 'processed' || false,
         refundStatus: cancellation?.refundStatus as RefundStatus,
         refundAmount: cancellation?.refundAmount ? parseFloat(cancellation.refundAmount.toString()) : null,
         // Coupon information
         couponCode: couponData?.couponCode || null,
         couponDescription: couponData?.couponDescription || null,
         discountAmount: couponData?.discountAmount || null,
      };
    }),

  updatePackaged: protectedProcedure
    .input(updatePackagedSchema)
    .mutation(async ({ input }) => {
      const { orderId, isPackaged } = input;

      if (!isPackaged) {
        await db.update(orderStatus).set({ isPackaged, isDelivered: false }).where(eq(orderStatus.orderId, parseInt(orderId)));
      } else {
        await db.update(orderStatus).set({ isPackaged }).where(eq(orderStatus.orderId, parseInt(orderId)));
      }

      const order = await db.query.orders.findFirst({ where: eq(orders.id, parseInt(orderId)) });
      if (order) await sendOrderPackagedNotification(order.userId, orderId);

      return { success: true };
    }),

  updateDelivered: protectedProcedure
    .input(updateDeliveredSchema)
    .mutation(async ({ input }) => {
      const { orderId, isDelivered } = input;

      await db.update(orderStatus).set({ isDelivered }).where(eq(orderStatus.orderId, parseInt(orderId)));

      const order = await db.query.orders.findFirst({ where: eq(orders.id, parseInt(orderId)) });
      if (order) await sendOrderDeliveredNotification(order.userId, orderId);

      return { success: true };
    }),

  getSlotOrders: protectedProcedure
    .input(getSlotOrdersSchema)
    .query(async ({ input }) => {
      const { slotId } = input;

      const slotOrders = await db.query.orders.findMany({
        where: eq(orders.slotId, parseInt(slotId)),
        with: {
          user: true,
          address: true,
          slot: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          orderStatus: true,
        },
      });

      const filteredOrders = slotOrders.filter(order => {
        const statusRecord = order.orderStatus[0];
        return order.isCod || (statusRecord && statusRecord.paymentStatus === 'success');
      });

       const formattedOrders = filteredOrders.map(order => {
         const statusRecord = order.orderStatus[0]; // assuming one status per order
         let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
         if (statusRecord?.isCancelled) {
           status = 'cancelled';
         } else if (statusRecord?.isDelivered) {
           status = 'delivered';
         }

         const items = order.orderItems.map(item => ({
          name: item.product.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price.toString()),
          amount: parseFloat(item.quantity) * parseFloat(item.price.toString()),
          unit: item.product.unit?.shortNotation || '',
        }));

        return {
          orderId: order.id.toString(),
          readableId: order.readableId,
          customerName: order.user.name,
          address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
          totalAmount: parseFloat(order.totalAmount),
          items,
          deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('h:mm a') : 'N/A',
          status,
          isPackaged: statusRecord?.isPackaged || false,
          isDelivered: statusRecord?.isDelivered || false,
          isCod: order.isCod,
          paymentMode: order.isCod ? 'COD' : 'Online',
          paymentStatus: statusRecord?.paymentStatus || 'pending',
          slotId: order.slotId,
        };
      });

      return { success: true, data: formattedOrders };
    }),

  getTodaysOrders: protectedProcedure
    .input(getTodaysOrdersSchema)
    .query(async ({ input }) => {
      const { slotId } = input;
      const start = dayjs().startOf('day').toDate();
      const end = dayjs().endOf('day').toDate();

      let whereCondition = and(gte(orders.createdAt, start), lt(orders.createdAt, end));
      console.log({slotId})
      
      if (slotId) {
        whereCondition = and(whereCondition, eq(orders.slotId, parseInt(slotId)));
      }

      const todaysOrders = await db.query.orders.findMany({
        where: whereCondition,
        with: {
          user: true,
          address: true,
          slot: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          orderStatus: true,
        },
      });

       const filteredOrders = todaysOrders.filter(order => {
         const statusRecord = order.orderStatus[0];
         return order.isCod || (statusRecord && statusRecord.paymentStatus === 'success');
       });

       const formattedOrders = filteredOrders.map(order => {
         const statusRecord = order.orderStatus[0]; // assuming one status per order
         let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
         if (statusRecord?.isCancelled) {
           status = 'cancelled';
         } else if (statusRecord?.isDelivered) {
           status = 'delivered';
         }

        const items = order.orderItems.map(item => ({
          name: item.product.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price.toString()),
          amount: parseFloat(item.quantity) * parseFloat(item.price.toString()),
          unit: item.product.unit?.shortNotation || '',
        }));

        return {
          orderId: order.id.toString(),
          readableId: order.readableId,
          customerName: order.user.name,
          address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
          totalAmount: parseFloat(order.totalAmount),
          items,
          deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('h:mm a') : 'N/A',
          status,
          isPackaged: statusRecord?.isPackaged || false,
          isDelivered: statusRecord?.isDelivered || false,
          isCod: order.isCod,
          paymentMode: order.isCod ? 'COD' : 'Online',
          paymentStatus: statusRecord?.paymentStatus || 'pending',
          slotId: order.slotId,
        };
      });

      return { success: true, data: formattedOrders };
    }),

  getAll: protectedProcedure
    .input(getAllOrdersSchema)
    .query(async ({ input }) => {
      const { cursor, limit, slotId, packagedFilter, deliveredFilter, cancellationFilter } = input;

      let whereCondition:SQL<unknown> | undefined = eq(orders.id, orders.id); // always true
      if (cursor) {
        whereCondition = and(whereCondition, lt(orders.id, cursor));
      }
      if (slotId) {
        whereCondition = and(whereCondition, eq(orders.slotId, slotId));
      }
      if (packagedFilter === 'packaged') {
        whereCondition = and(whereCondition, eq(orderStatus.isPackaged, true));
      } else if (packagedFilter === 'not_packaged') {
        whereCondition = and(whereCondition, eq(orderStatus.isPackaged, false));
      }
      if (deliveredFilter === 'delivered') {
        whereCondition = and(whereCondition, eq(orderStatus.isDelivered, true));
      } else if (deliveredFilter === 'not_delivered') {
        whereCondition = and(whereCondition, eq(orderStatus.isDelivered, false));
      }
      if (cancellationFilter === 'cancelled') {
        whereCondition = and(whereCondition, eq(orderStatus.isCancelled, true));
      } else if (cancellationFilter === 'not_cancelled') {
        whereCondition = and(whereCondition, eq(orderStatus.isCancelled, false));
      }

      const allOrders = await db.query.orders.findMany({
        where: whereCondition,
        orderBy: desc(orders.createdAt),
        limit: limit + 1, // fetch one extra to check if there's more
        with: {
          user: true,
          address: true,
          slot: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          orderStatus: true,
        },
      });

      const hasMore = allOrders.length > limit;
      const ordersToReturn = hasMore ? allOrders.slice(0, limit) : allOrders;

      const filteredOrders = ordersToReturn.filter(order => {
        const statusRecord = order.orderStatus[0];
        return order.isCod || (statusRecord && statusRecord.paymentStatus === 'success');
      });

      const formattedOrders = filteredOrders.map(order => {
        const statusRecord = order.orderStatus[0];
        let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
        if (statusRecord?.isCancelled) {
          status = 'cancelled';
        } else if (statusRecord?.isDelivered) {
          status = 'delivered';
        }

        const items = order.orderItems.map(item => ({
          name: item.product.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price.toString()),
          amount: parseFloat(item.quantity) * parseFloat(item.price.toString()),
          unit: item.product.unit?.shortNotation || '',
        }));

        return {
          id: order.id,
          readableId: order.readableId,
          customerName: order.user.name,
          address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
          totalAmount: parseFloat(order.totalAmount),
          items,
          createdAt: order.createdAt,
          deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('DD MMM, h:mm A') : 'N/A',
          status,
          isPackaged: statusRecord?.isPackaged || false,
          isDelivered: statusRecord?.isDelivered || false,
          isCod: order.isCod,
        };
      });

      return {
        orders: formattedOrders,
        nextCursor: hasMore ? ordersToReturn[ordersToReturn.length - 1].id : undefined,
      };
    }),
  });





// {"id": "order_Rhh00qJNdjUp8o", "notes": {"retry": "true", "customerOrderId": "14"}, "amount": 21000, "entity": "order", "status": "created", "receipt": "order_14_retry", "attempts": 0, "currency": "INR", "offer_id": null, "signature": "6df20655021f1d6841340f2a2ef2ef9378cb3d43495ab09e85f08aea1a851583", "amount_due": 21000, "created_at": 1763575791, "payment_id": "pay_Rhh15cLL28YM7j", "amount_paid": 0}


type RefundStatus = 'success' | 'pending' | 'failed' | 'none' | 'na';