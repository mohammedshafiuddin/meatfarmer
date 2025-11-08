import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { orders, orderItems, orderStatus, addresses, users, productInfo, deliverySlotInfo } from '../db/schema';
import { and, gte, lt, eq } from 'drizzle-orm';
import dayjs from 'dayjs';

export const updatePackaged = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { isPackaged } = req.body;

    await db.update(orderStatus).set({ isPackaged }).where(eq(orderStatus.orderId, parseInt(orderId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Update packaged error:', error);
    res.status(500).json({ error: 'Failed to update packaged status' });
  }
};

export const updateDelivered = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { isDelivered } = req.body;

    await db.update(orderStatus).set({ isDelivered }).where(eq(orderStatus.orderId, parseInt(orderId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Update delivered error:', error);
    res.status(500).json({ error: 'Failed to update delivered status' });
  }
};

export const getSlotOrders = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;

    const slotOrders = await db.query.orders.findMany({
      where: eq(orders.slotId, parseInt(slotId)),
      with: {
        user: true,
        address: true,
        slot: true,
        orderItems: {
          with: {
            product: {
              with: {
                unit: true,
              },
            },
          },
        },
        orderStatus: true,
      },
    });

    const filteredOrders = slotOrders.filter(order => {
      const statusRecord = order.orderStatus[0];
      return order.isCod || (statusRecord && statusRecord.paymentStatus === 'success');
    });

    const formattedOrders = filteredOrders.map(order => {
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
        unit: item.product.unit?.shortNotation || '',
      }));

      return {
        orderId: order.id.toString(),
        readableId: order.readableId,
        customerName: order.user.name,
        address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        totalAmount: parseFloat(order.totalAmount),
        items,
        deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('h:mm a') : 'N/A',
        status,
        isPackaged: statusRecord?.isPackaged || false,
        isDelivered: statusRecord?.isDelivered || false,
        isCod: order.isCod,
        paymentMode: order.isCod ? 'COD' : 'Online',
        paymentStatus: statusRecord?.paymentStatus || 'pending',
        slotId: order.slotId,
      };
    });

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Get slot orders error:', error);
    res.status(500).json({ error: 'Failed to fetch slot orders' });
  }
};

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
            product: {
              with: {
                unit: true,
              },
            },
          },
        },
        orderStatus: true,
      },
    });

    const filteredOrders = todaysOrders.filter(order => {
      const statusRecord = order.orderStatus[0];
      return order.isCod || (statusRecord && statusRecord.paymentStatus === 'success');
    });

    const formattedOrders = filteredOrders.map(order => {
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
        unit: item.product.unit?.shortNotation || '',
      }));

      return {
        orderId: order.id.toString(),
        readableId: order.readableId,
        customerName: order.user.name,
        address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        totalAmount: parseFloat(order.totalAmount),
        items,
        deliveryTime: order.slot ? dayjs(order.slot.deliveryTime).format('h:mm a') : 'N/A',
        status,
        isPackaged: statusRecord?.isPackaged || false,
        isDelivered: statusRecord?.isDelivered || false,
        isCod: order.isCod,
        paymentMode: order.isCod ? 'COD' : 'Online',
        paymentStatus: statusRecord?.paymentStatus || 'pending',
        slotId: order.slotId,
      };
    });

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Get todays orders error:', error);
    res.status(500).json({ error: 'Failed to fetch todays orders' });
  }
};
