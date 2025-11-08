import Razorpay from "razorpay";
import { razorpayId, razorpaySecret } from "../../lib/env-exporter";
import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, payments, orderStatus } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import crypto from 'crypto';

const razorpayInstance = new Razorpay({
    key_id: razorpayId,
    key_secret: razorpaySecret
});

const pendingTransactions = new Set<string>();

export const paymentRouter = router({
  createRazorpayOrder: protectedProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { orderId } = input;

      // Validate order exists and belongs to user
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, parseInt(orderId)),
      });

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId) {
        throw new ApiError("Order does not belong to user", 403);
      }

      // Create Razorpay order
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: parseFloat(order.totalAmount) * 100, // Convert to paisa
        currency: 'INR',
        receipt: `order_${orderId}`,
        notes: {
          customerOrderId: orderId,
        },
      });

      // Store payment info
      await db.insert(payments).values({
        status: 'pending',
        gateway: 'razorpay',
        orderId: parseInt(orderId),
        token: orderId,
        merchantOrderId: razorpayOrder.id,
        payload: razorpayOrder,
      });

      // Add to pending transactions
      pendingTransactions.add(razorpayOrder.id);

      return {
        razorpayOrderId: razorpayOrder.id,
        key: razorpayId,
      };
    }),

  retryPayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { orderId } = input;
      // Validate order exists and belongs to user
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId) {
        throw new ApiError("Order does not belong to user", 403);
      }

      // Check if order is already paid
      const orderStatusRecord = await db.query.orderStatus.findFirst({
        where: eq(orderStatus.orderId, orderId),
      });

      if (!orderStatusRecord) {
        throw new ApiError("Order status not found", 404);
      }

      if (orderStatusRecord.paymentStatus === 'success') {
        throw new ApiError("Order is already paid", 400);
      }

      // Get existing payment record
      const existingPayment = await db.query.payments.findFirst({
        where: eq(payments.orderId, orderId),
      });

      if (existingPayment) {
        // Update existing payment status to failed if it was pending
        if (existingPayment.status === 'pending') {
          await db
            .update(payments)
            .set({ status: 'failed' })
            .where(eq(payments.id, existingPayment.id));
        }
      }

      // Create new Razorpay order
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: parseFloat(order.totalAmount) * 100, // Convert to paisa
        currency: 'INR',
        receipt: `order_${orderId}_retry`,
        notes: {
          customerOrderId: orderId.toString(),
          retry: 'true',
        },
      });

      // Store new payment info
      await db.insert(payments).values({
        status: 'pending',
        gateway: 'razorpay',
        orderId: orderId,
        token: orderId.toString(),
        merchantOrderId: razorpayOrder.id,
        payload: razorpayOrder,
      });

      // Update order status to pending
      await db
        .update(orderStatus)
        .set({
          paymentStatus: 'pending',
        })
        .where(eq(orderStatus.orderId, orderId));

      // Add to pending transactions
      pendingTransactions.add(razorpayOrder.id);

      return {
        razorpayOrderId: razorpayOrder.id,
        key: razorpayId,
      };
    }),

  verifyPayment: protectedProcedure
    .input(z.object({
      razorpay_payment_id: z.string(),
      razorpay_order_id: z.string(),
      razorpay_signature: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = input;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Invalid payment signature", 400);
      }

      // Get current payment record
      const currentPayment = await db.query.payments.findFirst({
        where: eq(payments.merchantOrderId, razorpay_order_id),
      });

      if (!currentPayment) {
        throw new ApiError("Payment record not found", 404);
      }

      // Update payment status and payload
      const updatedPayload = {
        ...((currentPayment.payload as any) || {}),
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      };

      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: 'success',
          payload: updatedPayload,
        })
        .where(eq(payments.merchantOrderId, razorpay_order_id))
        .returning();

      // Update order status to mark payment as processed
      await db
        .update(orderStatus)
        .set({
          paymentStatus: 'success',
        })
        .where(eq(orderStatus.orderId, updatedPayment.orderId));

      return {
        success: true,
        message: "Payment verified successfully",
      };
    }),
});

