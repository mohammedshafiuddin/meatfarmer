import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderStatus, users, addresses, orderItems, productInfo, units } from '../../db/schema';
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
  getAll: publicProcedure
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
            },
          },
        },
        orderBy: [desc(orderStatus.orderTime)],
      });

      return cancelledOrderStatuses.map(status => ({
        id: status.order.id,
        readableId: status.order.readableId,
        customerName: `${status.order.user.name}`,
        address: `${status.order.address.addressLine1}, ${status.order.address.city}`,
        totalAmount: status.order.totalAmount,
        cancellationReviewed: status.order.cancellationReviewed,
        isRefundDone: status.order.isRefundDone,
        adminNotes: status.order.adminNotes,
        cancelReason: status.cancelReason,
        items: status.order.orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.product.unit?.shortNotation,
          amount: parseFloat(item.price.toString()) * parseFloat(item.quantity || '0'),
        })),
        createdAt: status.order.createdAt,
      }));
    }),

  updateReview: publicProcedure
    .input(updateCancellationReviewSchema)
    .mutation(async ({ input }) => {
      const { orderId, cancellationReviewed, adminNotes } = input;

      const result = await db.update(orders)
        .set({
          cancellationReviewed,
          adminNotes: adminNotes || null,
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Order not found");
      }

      return result[0];
    }),

  updateRefund: publicProcedure
    .input(updateRefundSchema)
    .mutation(async ({ input }) => {
      const { orderId, isRefundDone } = input;

      const result = await db.update(orders)
        .set({
          isRefundDone,
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Order not found");
      }

      return result[0];
    }),
});