import Razorpay from "razorpay";
import { razorpayId, razorpaySecret } from "../../lib/env-exporter";
import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, payments, orderStatus, orderCancellationsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import crypto from 'crypto';
import { DiskPersistedSet } from "src/lib/disk-persisted-set";

const razorpayInstance = new Razorpay({
    key_id: razorpayId,
    key_secret: razorpaySecret
});


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

  initiateRefund: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      refundPercent: z.number().min(0).max(100).optional(),
      refundAmount: z.number().min(0).optional(),
    }).refine((data) => {
      const hasPercent = data.refundPercent !== undefined;
      const hasAmount = data.refundAmount !== undefined;
      return (hasPercent && !hasAmount) || (!hasPercent && hasAmount);
    }, { message: "Provide either refundPercent or refundAmount, not both or neither" }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { orderId, refundPercent, refundAmount } = input;

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

      // Check if order is paid
      const orderStatusRecord = await db.query.orderStatus.findFirst({
        where: eq(orderStatus.orderId, orderId),
      });

      if (!orderStatusRecord || orderStatusRecord.paymentStatus !== 'success') {
        throw new ApiError("Order is not paid or payment not verified", 400);
      }

      // Get payment record
      const payment = await db.query.payments.findFirst({
        where: eq(payments.orderId, orderId),
      });

      if (!payment || payment.status !== 'success') {
        throw new ApiError("Payment not found or not successful", 404);
      }

      // Calculate refund amount
      let calculatedRefundAmount: number;
      if (refundPercent !== undefined) {
        calculatedRefundAmount = (parseFloat(order.totalAmount) * refundPercent) / 100;
      } else if (refundAmount !== undefined) {
        calculatedRefundAmount = refundAmount;
        if (calculatedRefundAmount > parseFloat(order.totalAmount)) {
          throw new ApiError("Refund amount cannot exceed order total", 400);
        }
      } else {
        throw new ApiError("Invalid refund parameters", 400);
      }

      // Initiate Razorpay refund
      const razorpayRefund = await razorpayInstance.payments.refund(payment.merchantOrderId, {
        amount: Math.round(calculatedRefundAmount * 100), // Convert to paisa
      });

      // Insert refund record
      await db.insert(orderCancellationsTable).values({
        orderId,
        userId,
        refundAmount: calculatedRefundAmount.toString(),
        refundStatus: 'initiated',
        razorpayRefundId: razorpayRefund.id,
      });

      return {
        refundId: razorpayRefund.id,
        amount: calculatedRefundAmount,
        status: 'initiated',
        message: "Refund initiated successfully",
      };
    }),
});

