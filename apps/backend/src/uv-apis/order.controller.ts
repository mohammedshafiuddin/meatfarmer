import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { orders, orderItems, orderStatus, addresses, productInfo, paymentInfoTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface PlaceOrderRequest {
  selectedItems: { productId: number; quantity: number }[];
  addressId: number;
  paymentMethod: 'online' | 'cod';
}

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { selectedItems, addressId, slotId, paymentMethod } = req.body;

    // Validate address belongs to user
    const address = await db.query.addresses.findFirst({
      where: and(eq(addresses.userId, userId), eq(addresses.id, addressId)),
    });
    if (!address) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItemsData: Array<{productId: number; quantity: string; price: any}> = [];
    for (const item of selectedItems) {
      const product = await db.query.productInfo.findFirst({
        where: eq(productInfo.id, item.productId),
      });
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      totalAmount += parseFloat(product.price.toString()) * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity.toString(),
        price: product.price,
      });
    }

    // Create order in transaction
    const newOrder = await db.transaction(async (tx) => {
      let paymentInfoId: number | null = null;

      if (paymentMethod === 'online') {
        // Create payment info for online payment
        const [paymentInfo] = await tx.insert(paymentInfoTable).values({
          status: 'pending',
          gateway: 'phonepe', // or whatever
          merchantOrderId: `order_${Date.now()}`, // generate unique
          // other fields as needed
        }).returning();
        paymentInfoId = paymentInfo.id;
      }

      const [order] = await tx.insert(orders).values({
        userId,
        addressId,
        slotId,
        isCod: paymentMethod === 'cod',
        isOnlinePayment: paymentMethod === 'online',
        paymentInfoId,
        totalAmount: totalAmount.toString(),
      }).returning();

      for (const item of orderItemsData) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          ...item,
        });
      }

      await tx.insert(orderStatus).values({
        userId,
        orderId: order.id,
        // no payment fields here
      });

      return order;
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};