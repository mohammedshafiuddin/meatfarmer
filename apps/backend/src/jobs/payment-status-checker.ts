import * as cron from 'node-cron';
import { db } from '../db/db_index';
import { payments, orders, deliverySlotInfo, refunds } from '../db/schema';
import { eq, and, gt, isNotNull } from 'drizzle-orm';
import { RazorpayPaymentService } from '../lib/payments-utils';

interface PendingPaymentRecord {
  payment: typeof payments.$inferSelect;
  order: typeof orders.$inferSelect;
  slot: typeof deliverySlotInfo.$inferSelect;
}

export const createPaymentNotification = (record: PendingPaymentRecord) => {
  // Construct message from record data
  const message = `Payment pending for order ORD${record.order.readableId.toString().padStart(3, '0')}. Please complete before freeze time.`;

  // TODO: Implement notification sending logic using record.order.userId, record.order.id, message
  console.log(`Sending notification to user ${record.order.userId} for order ${record.order.id}: ${message}`);
};

export const checkRefundStatuses = async () => {
  try {
      const initiatedRefunds = await db
        .select()
        .from(refunds)
        .where(and(
          eq(refunds.refundStatus, 'initiated'),
          isNotNull(refunds.merchantRefundId)
        ));

      // Process refunds concurrently using Promise.allSettled
      const promises = initiatedRefunds.map(async (refund) => {
        if (!refund.merchantRefundId) return;

        try {
          const razorpayRefund = await RazorpayPaymentService.fetchRefund(refund.merchantRefundId);
        // console.log({refundId: refund.merchantRefundId, refundStatus: JSON.stringify(razorpayRefund)});
        
        if (razorpayRefund.status === 'processed') {
          await db
            .update(refunds)
            .set({ refundStatus: 'success', refundProcessedAt: new Date() })
            .where(eq(refunds.id, refund.id));
        }
      } catch (error) {
        console.error(`Error checking refund ${refund.id}:`, error);
      }
    });

    // Wait for all promises to complete
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error in checkRefundStatuses:', error);
  }
};

export const checkPendingPayments = async () => {
  try {
    const pendingPayments = await db
      .select({
        payment: payments,
        order: orders,
        slot: deliverySlotInfo,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(deliverySlotInfo, eq(orders.slotId, deliverySlotInfo.id))
      .where(and(
        eq(payments.status, 'pending'),
        gt(deliverySlotInfo.freezeTime, new Date()) // Freeze time not passed
      ));

    for (const record of pendingPayments) {
      createPaymentNotification(record);
    }
  } catch (error) {
    console.error('Error checking pending payments:', error);
  }
};

