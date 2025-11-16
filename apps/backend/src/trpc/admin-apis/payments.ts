import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { orders, orderStatus, payments, orderCancellationsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import Razorpay from 'razorpay';
import { razorpayId, razorpaySecret } from "../../lib/env-exporter";

const razorpayInstance = new Razorpay({
    key_id: razorpayId,
    key_secret: razorpaySecret
});

const initiateRefundSchema = z.object({
  orderId: z.number(),
  refundPercent: z.number().min(0).max(100).optional(),
  refundAmount: z.number().min(0).optional(),
}).refine((data) => {
  const hasPercent = data.refundPercent !== undefined;
  const hasAmount = data.refundAmount !== undefined;
  return (hasPercent && !hasAmount) || (!hasPercent && hasAmount);
}, { message: "Provide either refundPercent or refundAmount, not both or neither" });

export const adminPaymentsRouter = router({
  initiateRefund: publicProcedure
    .input(initiateRefundSchema)
    .mutation(async ({ input }) => {
      const { orderId, refundPercent, refundAmount } = input;

      // Validate order exists
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new ApiError("Order not found", 404);
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

      // Update or insert refund record
      await db.insert(orderCancellationsTable).values({
        orderId,
        userId: order.userId,
        refundAmount: calculatedRefundAmount.toString(),
        refundStatus: 'initiated',
        razorpayRefundId: razorpayRefund.id,
      }).onConflictDoUpdate({
        target: orderCancellationsTable.orderId,
        set: {
          refundAmount: calculatedRefundAmount.toString(),
          refundStatus: 'initiated',
          razorpayRefundId: razorpayRefund.id,
          refundProcessedAt: null,
        },
      });

      return {
        refundId: razorpayRefund.id,
        amount: calculatedRefundAmount,
        status: 'initiated',
        message: "Refund initiated successfully",
      };
    }),
});