import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderItems, users, addresses, productInfo, units, deliverySlotInfo, payments, paymentInfoTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

const updateOrderNotesSchema = z.object({
  orderId: z.number(),
  adminNotes: z.string(),
});

const getFullOrderSchema = z.object({
  orderId: z.number(),
});

export const orderRouter = router({
  updateNotes: publicProcedure
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

  getFullOrder: publicProcedure
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
        createdAt: orderData.createdAt,
        items: orderData.orderItems.map(item => ({
          id: item.id,
          productName: item.product.name,
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
      };
    }),
});