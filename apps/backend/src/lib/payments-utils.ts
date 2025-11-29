import Razorpay from "razorpay";
import { razorpayId, razorpaySecret } from "./env-exporter";
import { db } from "../db/db_index";
import { payments } from "../db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class RazorpayPaymentService {
  private static instance = new Razorpay({
    key_id: razorpayId,
    key_secret: razorpaySecret,
  });

  static async createOrder(orderId: number, amount: string) {
    // Create Razorpay order
    const razorpayOrder = await this.instance.orders.create({
      amount: parseFloat(amount) * 100, // Convert to paisa
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: {
        customerOrderId: orderId.toString(),
      },
    });

    return razorpayOrder;
  }

  static async insertPaymentRecord(orderId: number, razorpayOrder: any, tx?: Tx) {
    // Use transaction if provided, otherwise use db
    const dbInstance = tx || db;

    // Insert payment record
    const [payment] = await dbInstance
      .insert(payments)
      .values({
        status: 'pending',
        gateway: 'razorpay',
        orderId,
        token: orderId.toString(),
        merchantOrderId: razorpayOrder.id,
        payload: razorpayOrder,
      })
      .returning();

    return payment;
  }

  static async initiateRefund(paymentId: string, amount: number) {
    const refund = await this.instance.payments.refund(paymentId, {
      amount,
    });
    return refund;
  }

  static async fetchRefund(refundId: string) {
    const refund = await this.instance.refunds.fetch(refundId);
    return refund;
  }
}