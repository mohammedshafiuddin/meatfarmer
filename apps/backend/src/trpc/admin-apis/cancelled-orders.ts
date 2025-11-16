import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderStatus, users, addresses, orderItems, productInfo, units, orderCancellationsTable } from '../../db/schema';
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
              orderCancellations: true,
            },
          },
        },
        orderBy: [desc(orderStatus.orderTime)],
      });

      const filteredStatuses = cancelledOrderStatuses.filter(status => {
        return status.order.isCod || status.paymentStatus === 'success';
      });

      return filteredStatuses.map(status => {
        const cancellation = status.order.orderCancellations[0];
        return {
          id: status.order.id,
          readableId: status.order.readableId,
          customerName: `${status.order.user.name}`,
          address: `${status.order.address.addressLine1}, ${status.order.address.city}`,
          totalAmount: status.order.totalAmount,
          cancellationReviewed: cancellation?.cancellationReviewed || false,
          isRefundDone: cancellation?.refundStatus === 'processed' || false,
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

      const result = await db.update(orderCancellationsTable)
        .set({
          cancellationReviewed,
          cancellationAdminNotes: adminNotes || null,
          reviewedAt: new Date(),
        })
        .where(eq(orderCancellationsTable.orderId, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Cancellation record not found");
      }

      return result[0];
    }),

  updateRefund: protectedProcedure
    .input(updateRefundSchema)
    .mutation(async ({ input }) => {
      const { orderId, isRefundDone } = input;

      const refundStatus = isRefundDone ? 'processed' : 'none';
      const result = await db.update(orderCancellationsTable)
        .set({
          refundStatus,
          refundProcessedAt: isRefundDone ? new Date() : null,
        })
        .where(eq(orderCancellationsTable.orderId, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Cancellation record not found");
      }

      return result[0];
    }),
});