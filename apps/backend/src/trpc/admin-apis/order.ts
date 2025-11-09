import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderItems, orderStatus, users, addresses, productInfo, units, deliverySlotInfo, payments, paymentInfoTable } from '../../db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import dayjs from 'dayjs';
import { sendOrderPackagedNotification, sendOrderDeliveredNotification } from '../../lib/notif-job';

const updateOrderNotesSchema = z.object({
  orderId: z.number(),
  adminNotes: z.string(),
});

const getFullOrderSchema = z.object({
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
        userNotes: orderData.userNotes,
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

  updatePackaged: publicProcedure
    .input(updatePackagedSchema)
    .mutation(async ({ input }) => {
      const { orderId, isPackaged } = input;

      await db.update(orderStatus).set({ isPackaged }).where(eq(orderStatus.orderId, parseInt(orderId)));

      const order = await db.query.orders.findFirst({ where: eq(orders.id, parseInt(orderId)) });
      if (order) await sendOrderPackagedNotification(order.userId, orderId);

      return { success: true };
    }),

  updateDelivered: publicProcedure
    .input(updateDeliveredSchema)
    .mutation(async ({ input }) => {
      const { orderId, isDelivered } = input;

      await db.update(orderStatus).set({ isDelivered }).where(eq(orderStatus.orderId, parseInt(orderId)));

      const order = await db.query.orders.findFirst({ where: eq(orders.id, parseInt(orderId)) });
      if (order) await sendOrderDeliveredNotification(order.userId, orderId);

      return { success: true };
    }),

  getSlotOrders: publicProcedure
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
        const status: 'pending' | 'delivered' | 'cancelled' = statusRecord?.isCancelled
          ? 'cancelled'
          : statusRecord?.isDelivered
          ? 'delivered'
          : 'pending';

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

  getTodaysOrders: publicProcedure
    .input(getTodaysOrdersSchema)
    .query(async ({ input }) => {
      const { slotId } = input;
      const start = dayjs().startOf('day').toDate();
      const end = dayjs().endOf('day').toDate();

      let whereCondition = and(gte(orders.createdAt, start), lt(orders.createdAt, end));
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
        const status: 'pending' | 'delivered' | 'cancelled' = statusRecord?.isCancelled
          ? 'cancelled'
          : statusRecord?.isDelivered
          ? 'delivered'
          : 'pending';

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
});