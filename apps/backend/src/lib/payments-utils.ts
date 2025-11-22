import Razorpay from "razorpay";
import { razorpayId, razorpaySecret } from "./env-exporter";
import { db } from "../db/db_index";
import { payments } from "../db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const razorpayInstance = new Razorpay({
  key_id: razorpayId,
  key_secret: razorpaySecret,
});

export const createRazorpayOrder = async (
  orderId: number,
  amount: string
) => {
  // Create Razorpay order
  const razorpayOrder = await razorpayInstance.orders.create({
    amount: parseFloat(amount) * 100, // Convert to paisa
    currency: 'INR',
    receipt: `order_${orderId}`,
    notes: {
      customerOrderId: orderId.toString(),
    },
  });

  return razorpayOrder;
};

export const insertPaymentRecord = async (
  orderId: number,
  razorpayOrder: any,
  tx?: Tx
) => {
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
};