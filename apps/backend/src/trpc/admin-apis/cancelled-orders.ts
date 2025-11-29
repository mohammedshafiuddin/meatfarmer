import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderStatus, users, addresses, orderItems, productInfo, units, refunds } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const updateCancellationReviewSchema = z.object({
  orderId: z.number(),
  cancellationReviewed: z.boolean(),
  adminNotes: z.string().optional(),
});

const updateRefundSchema = z.object({
  orderId: z.number(),
  isRefundDone: z.boolean(),
});

export const cancelledOrdersRouter = router({
  getAll: protectedProcedure
    .query(async () => {
      // First get cancelled order statuses with order details
      const cancelledOrderStatuses = await db.query.orderStatus.findMany({
        where: eq(orderStatus.isCancelled, true),
        with: {
          order: {
            with: {
              user: true,
              address: true,
              orderItems: {
                with: {
                  product: {
                    with: {
                      unit: true,
                    },
                  },
                },
              },
              refunds: true,
            },
          },
        },
        orderBy: [desc(orderStatus.orderTime)],
      });

      const filteredStatuses = cancelledOrderStatuses.filter(status => {
        return status.order.isCod || status.paymentStatus === 'success';
      });

      return filteredStatuses.map(status => {
        const refund = status.order.refunds[0];
        return {
          id: status.order.id,
          readableId: status.order.readableId,
           customerName: `${status.order.user.name}`,
           address: `${status.order.address.addressLine1}, ${status.order.address.city}`,
            totalAmount: status.order.totalAmount,
             cancellationReviewed: status.cancellationReviewed || false,
             isRefundDone: refund?.refundStatus === 'processed' || false,
            adminNotes: status.order.adminNotes,
          cancelReason: status.cancelReason,
          paymentMode: status.order.isCod ? 'COD' : 'Online',
          paymentStatus: status.paymentStatus || 'pending',
          items: status.order.orderItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            unit: item.product.unit?.shortNotation,
            amount: parseFloat(item.price.toString()) * parseFloat(item.quantity || '0'),
          })),
          createdAt: status.order.createdAt,
        };
      });
    }),

  updateReview: protectedProcedure
    .input(updateCancellationReviewSchema)
    .mutation(async ({ input }) => {
      const { orderId, cancellationReviewed, adminNotes } = input;

      const result = await db.update(orderStatus)
        .set({
          cancellationReviewed,
          cancellationAdminNotes: adminNotes || null,
          cancellationReviewedAt: new Date(),
        })
        .where(eq(orderStatus.orderId, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Cancellation record not found");
      }

      return result[0];
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id } = input;

      // Get cancelled order with full details
      const cancelledOrderStatus = await db.query.orderStatus.findFirst({
        where: eq(orderStatus.id, id),
        with: {
          order: {
            with: {
              user: true,
              address: true,
              orderItems: {
                with: {
                  product: {
                    with: {
                      unit: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!cancelledOrderStatus || !cancelledOrderStatus.isCancelled) {
        throw new Error("Cancelled order not found");
      }

      // Get refund details separately
      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.orderId, cancelledOrderStatus.orderId),
      });

      const order = cancelledOrderStatus.order;

      // Format the response similar to the getAll method
      const formattedOrder = {
        id: order.id,
        readableId: order.readableId,
        customerName: order.user.name,
        address: `${order.address.addressLine1}${order.address.addressLine2 ? ', ' + order.address.addressLine2 : ''}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`,
        totalAmount: order.totalAmount,
        cancellationReviewed: cancelledOrderStatus.cancellationReviewed || false,
        isRefundDone: refund?.refundStatus === 'processed' || false,
        adminNotes: cancelledOrderStatus.cancellationAdminNotes || null,
        cancelReason: cancelledOrderStatus.cancelReason || null,
        items: order.orderItems.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
          unit: item.product.unit?.shortNotation || 'unit',
          amount: parseFloat(item.price.toString()) * parseFloat(item.quantity),
          image: item.product.images?.[0] || null,
        })),
        createdAt: order.createdAt.toISOString(),
      };

      return { order: formattedOrder };
    }),

  updateRefund: protectedProcedure
    .input(updateRefundSchema)
    .mutation(async ({ input }) => {
      const { orderId, isRefundDone } = input;

      const refundStatus = isRefundDone ? 'processed' : 'none';
      const result = await db.update(refunds)
        .set({
          refundStatus,
          refundProcessedAt: isRefundDone ? new Date() : null,
        })
        .where(eq(refunds.orderId, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Cancellation record not found");
      }

      return result[0];
    }),
});