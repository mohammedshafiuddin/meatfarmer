
import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, payments, orderStatus } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import crypto from 'crypto';
import { razorpayId, razorpaySecret } from "../../lib/env-exporter";
import { DiskPersistedSet } from "src/lib/disk-persisted-set";
import { RazorpayPaymentService } from "../../lib/payments-utils";




export const paymentRouter = router({
  createRazorpayOrder: protectedProcedure //either create a new payment order or return the existing one
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

       // Check for existing pending payment
       const existingPayment = await db.query.payments.findFirst({
         where: eq(payments.orderId, parseInt(orderId)),
       });

       if (existingPayment && existingPayment.status === 'pending') {
         return {
           razorpayOrderId: existingPayment.merchantOrderId,
           key: razorpayId,
         };
       }

         // Create Razorpay order and insert payment record
         const razorpayOrder = await RazorpayPaymentService.createOrder(parseInt(orderId), order.totalAmount);
         await RazorpayPaymentService.insertPaymentRecord(parseInt(orderId), razorpayOrder);

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

  markPaymentFailed: protectedProcedure
    .input(z.object({
      merchantOrderId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { merchantOrderId } = input;

      // Find payment by merchantOrderId
      const payment = await db.query.payments.findFirst({
        where: eq(payments.merchantOrderId, merchantOrderId),
      });

      if (!payment) {
        throw new ApiError("Payment not found", 404);
      }

      // Check if payment belongs to user's order
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, payment.orderId),
      });

      if (!order || order.userId !== userId) {
        throw new ApiError("Payment does not belong to user", 403);
      }

      // Update payment status to failed
      await db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));

      return {
        success: true,
        message: "Payment marked as failed",
      };
    }),

});

