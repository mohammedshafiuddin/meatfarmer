import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { orders, orderItems, orderStatus, addresses, users, productInfo, deliverySlotInfo } from '../db/schema';
import { and, gte, lt, eq } from 'drizzle-orm';
import dayjs from 'dayjs';

export const getTodaysOrders = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.query;
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();

    let whereCondition = and(gte(orders.createdAt, start), lt(orders.createdAt, end));
    if (slotId) {
      whereCondition = and(whereCondition, eq(orders.slotId, parseInt(slotId as string)));
    }

    const todaysOrders = await db.query.orders.findMany({
      where: whereCondition,
      with: {
        user: true,
        address: true,
        slot: true,
        orderItems: {
          with: {
            product: true,
          },
        },
        orderStatus: true,
      },
    });

    const formattedOrders = todaysOrders.map(order => {
      const statusRecord = order.orderStatus[0]; // assuming one status per order
      const status: 'pending' | 'delivered' | 'cancelled' = statusRecord?.isCancelled
        ? 'cancelled'
        : statusRecord?.isDelivered
        ? 'delivered'
        : 'pending';

      const items = order.orderItems.map(item => ({
        name: item.product.name,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price.toString()),
        amount: parseFloat(item.quantity) * parseFloat(item.price.toString()),
      }));

      return {
        orderId: order.id.toString(),
        customerName: order.user.name,
        address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        totalAmount: parseFloat(order.totalAmount),
        items,
        deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('h:mm a') : 'N/A',
        status,
        isPackaged: statusRecord?.isPackaged || false,
        slotId: order.slotId,
      };
    });

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Get todays orders error:', error);
    res.status(500).json({ error: 'Failed to fetch todays orders' });
  }
};