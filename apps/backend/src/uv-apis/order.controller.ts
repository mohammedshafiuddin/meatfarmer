import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { orders, orderItems, orderStatus, addresses, productInfo, paymentInfoTable, keyValStore, deliverySlotInfo, coupons, couponUsage } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { READABLE_ORDER_ID_KEY } from '../lib/const-strings';
import { generateSignedUrlsFromS3Urls } from '../lib/s3-client';
import { sendOrderPlacedNotification, sendOrderCancelledNotification } from '../lib/notif-job';

interface PlaceOrderRequest {
  selectedItems: { productId: number; quantity: number }[];
  addressId: number;
  paymentMethod: 'online' | 'cod';
  couponId?: number;
}

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { selectedItems, addressId, slotId, paymentMethod, couponId } = req.body;

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

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponId) {
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.id, couponId),
        with: {
          usages: {
            where: eq(couponUsage.userId, userId)
          }
        }
      });

      if (!coupon) {
        return res.status(400).json({ error: 'Invalid coupon' });
      }

      // Check if coupon is invalidated
      if (coupon.isInvalidated) {
        return res.status(400).json({ error: 'Coupon is no longer valid' });
      }

      // Check expiration
      if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
        return res.status(400).json({ error: 'Coupon has expired' });
      }

      // Check minimum order requirement
      if (coupon.minOrder && parseFloat(coupon.minOrder) > totalAmount) {
        return res.status(400).json({ error: 'Order amount does not meet coupon minimum requirement' });
      }

      // Check usage limits
      if (coupon.maxLimitForUser) {
        const usageCount = coupon.usages.length;
        if (usageCount >= coupon.maxLimitForUser) {
          return res.status(400).json({ error: 'Coupon usage limit exceeded' });
        }
      }

      // Calculate discount
      if (coupon.discountPercent) {
        discountAmount = Math.min(
          (totalAmount * parseFloat(coupon.discountPercent)) / 100,
          coupon.maxValue ? parseFloat(coupon.maxValue) : Infinity
        );
      } else if (coupon.flatDiscount) {
        discountAmount = Math.min(
          parseFloat(coupon.flatDiscount),
          coupon.maxValue ? parseFloat(coupon.maxValue) : totalAmount
        );
      }

      appliedCoupon = coupon;
    }

    const finalAmount = totalAmount - discountAmount;

    // Create order in transaction
    const newOrder = await db.transaction(async (tx) => {
      // Get and increment readable order ID
      let currentReadableId = 1;
      const existing = await tx.query.keyValStore.findFirst({
        where: eq(keyValStore.key, READABLE_ORDER_ID_KEY),
      });
      if (existing) {
        currentReadableId = (existing.value as { value: number }).value + 1;
      }
      await tx.insert(keyValStore).values({
        key: READABLE_ORDER_ID_KEY,
        value: { value: currentReadableId },
      }).onConflictDoUpdate({
        target: keyValStore.key,
        set: { value: { value: currentReadableId } },
      });

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
         totalAmount: finalAmount.toString(),
         readableId: currentReadableId,
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

    // Add coupon usage record if coupon was applied
    if (appliedCoupon) {
      await db.insert(couponUsage).values({
        userId,
        couponId: appliedCoupon.id,
        usedAt: new Date(),
      });
    }

    await sendOrderPlacedNotification(userId, newOrder.id.toString());

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        orderItems: {
          with: {
            product: true,
          },
        },
        slot: true,
        paymentInfo: true,
        orderStatus: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    const mappedOrders = await Promise.all(userOrders.map(async (order) => {
      const status = order.orderStatus[0]; // assuming one status per order
      const deliveryStatus = status?.isCancelled ? 'cancelled' : status?.isDelivered ? 'success' : 'pending';
      const orderStatus = status?.isCancelled ? 'cancelled' : 'success';
      const paymentMode = order.isCod ? 'CoD' : 'Online';

      const items = await Promise.all(order.orderItems.map(async (item) => {
        const signedImages = item.product.images ? await generateSignedUrlsFromS3Urls(item.product.images as string[]) : [];
        return {
          productName: item.product.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price.toString()),
          amount: parseFloat(item.price.toString()) * parseFloat(item.quantity),
          image: signedImages[0] || null,
        };
      }));

      return {
        orderId: `ORD${order.readableId.toString().padStart(3, '0')}`,
        orderDate: order.createdAt.toISOString(),
        deliveryStatus,
        deliveryDate: order.slot?.deliveryTime.toISOString(),
        orderStatus,
        cancelReason: status?.cancelReason || null,
        paymentMode,
        isRefundDone: status?.isRefundDone || false,
        items,
      };
    }));

    res.status(200).json({ success: true, data: mappedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    console.log('Cancel order request:', { userId, orderId: id, reason });

    // Extract readable ID from orderId (e.g., ORD001 -> 1)
    const readableIdMatch = id.match(/^ORD(\d+)$/);
    if (!readableIdMatch) {
      console.error('Invalid order ID format:', id);
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    const readableId = parseInt(readableIdMatch[1]);

    // Check if order exists and belongs to user
    const order = await db.query.orders.findFirst({
      where: eq(orders.readableId, readableId),
      with: {
        orderStatus: true,
      },
    });

    if (!order) {
      console.error('Order not found:', id);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== userId) {
      console.error('Order does not belong to user:', { orderId: id, orderUserId: order.userId, requestUserId: userId });
      return res.status(404).json({ error: 'Order not found' });
    }

    const status = order.orderStatus[0];
    if (!status) {
      console.error('Order status not found for order:', id);
      return res.status(400).json({ error: 'Order status not found' });
    }

    if (status.isCancelled) {
      console.error('Order is already cancelled:', id);
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (status.isDelivered) {
      console.error('Cannot cancel delivered order:', id);
      return res.status(400).json({ error: 'Cannot cancel delivered order' });
    }

    // Update order status
    await db.update(orderStatus)
      .set({
        isCancelled: true,
        cancelReason: reason,
      })
      .where(eq(orderStatus.id, status.id));

    await sendOrderCancelledNotification(userId, order.id.toString());

    console.log('Order cancelled successfully:', id);
    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};