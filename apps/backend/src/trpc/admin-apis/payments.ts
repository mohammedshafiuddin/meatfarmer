import { router, protectedProcedure } from "../trpc-index";
import { z } from "zod";
import { db } from "../../db/db_index";
import {
  orders,
  orderStatus,
  payments,
  refunds,
} from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ApiError } from "../../lib/api-error";
import { RazorpayPaymentService } from "../../lib/payments-utils";

const initiateRefundSchema = z
  .object({
    orderId: z.number(),
    refundPercent: z.number().min(0).max(100).optional(),
    refundAmount: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      const hasPercent = data.refundPercent !== undefined;
      const hasAmount = data.refundAmount !== undefined;
      return (hasPercent && !hasAmount) || (!hasPercent && hasAmount);
    },
    {
      message:
        "Provide either refundPercent or refundAmount, not both or neither",
    }
  );

export const adminPaymentsRouter = router({
  initiateRefund: protectedProcedure
    .input(initiateRefundSchema)
    .mutation(async ({ input }) => {
      try {
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

        if(order.isCod) {
          throw new ApiError("Order is a Cash On Delivery. Not eligible for refund")
        }

        if (
          !orderStatusRecord ||
          (orderStatusRecord.paymentStatus !== "success" &&
           !(order.isCod && orderStatusRecord.isDelivered))
        ) {
          throw new ApiError("Order payment not verified or not eligible for refund", 400);
        }

        // Calculate refund amount
        let calculatedRefundAmount: number;
        if (refundPercent !== undefined) {
          calculatedRefundAmount =
            (parseFloat(order.totalAmount) * refundPercent) / 100;
        } else if (refundAmount !== undefined) {
          calculatedRefundAmount = refundAmount;
          if (calculatedRefundAmount > parseFloat(order.totalAmount)) {
            throw new ApiError("Refund amount cannot exceed order total", 400);
          }
        } else {
          throw new ApiError("Invalid refund parameters", 400);
        }

        let razorpayRefund = null;
        let merchantRefundId = null;

          // Get payment record for online payments
          const payment = await db.query.payments.findFirst({
            where: and(
              eq(payments.orderId, orderId),
              eq(payments.status, "success")
            ),
          });

          if (!payment || payment.status !== "success") {
            throw new ApiError("Payment not found or not successful", 404);
          }

          const payload = payment.payload as any;
          // Initiate Razorpay refund
          razorpayRefund = await RazorpayPaymentService.initiateRefund(
            payload.payment_id,
            Math.round(calculatedRefundAmount * 100) // Convert to paisa
          );
          merchantRefundId = razorpayRefund.id;

        

        // Check if refund already exists for this order
        const existingRefund = await db.query.refunds.findFirst({
          where: eq(refunds.orderId, orderId),
        });

        const refundStatus = "initiated";

        if (existingRefund) {
          // Update existing refund
          await db
            .update(refunds)
            .set({
              refundAmount: calculatedRefundAmount.toString(),
              refundStatus,
              merchantRefundId,
              refundProcessedAt: order.isCod ? new Date() : null,
            })
            .where(eq(refunds.id, existingRefund.id));
        } else {
          // Insert new refund
          await db
            .insert(refunds)
            .values({
              orderId,
              refundAmount: calculatedRefundAmount.toString(),
              refundStatus,
              merchantRefundId,
            });
        }

        return {
          refundId: merchantRefundId || `cod_${orderId}`,
          amount: calculatedRefundAmount,
          status: refundStatus,
          message: order.isCod ? "COD refund processed successfully" : "Refund initiated successfully",
        };
      }
      catch(e) {
        console.log(e);
        throw new ApiError("Failed to initiate refund")
      }
    }),
});
