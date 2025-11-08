import { Queue, Worker } from 'bullmq';
import { redisUrl } from './env-exporter';
import {
  NOTIFS_QUEUE,
  ORDER_PLACED_MESSAGE,
  PAYMENT_FAILED_MESSAGE,
  ORDER_PACKAGED_MESSAGE,
  ORDER_OUT_FOR_DELIVERY_MESSAGE,
  ORDER_DELIVERED_MESSAGE,
  ORDER_CANCELLED_MESSAGE,
  REFUND_INITIATED_MESSAGE
} from './const-strings';

export const notificationQueue = new Queue(NOTIFS_QUEUE, {
  connection: { url: redisUrl },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
  },
});

export const notificationWorker = new Worker(NOTIFS_QUEUE, async (job) => {
  if (!job) return;
  console.log(`Processing notification job ${job.id}`);
  // TODO: Implement sendPushNotification
}, {
  connection: { url: redisUrl },
  concurrency: 5,
});

notificationWorker.on('completed', (job) => {
  if (job) console.log(`Notification job ${job.id} completed`);
});
notificationWorker.on('failed', (job, err) => {
  if (job) console.error(`Notification job ${job.id} failed:`, err);
});

export async function scheduleNotification(userId: number, payload: any, options?: { delay?: number; priority?: number }) {
  const jobData = { userId, ...payload };
  await notificationQueue.add('send-notification', jobData, options);
}

// Utility methods for specific notification events
export async function sendOrderPlacedNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Order Placed',
    body: ORDER_PLACED_MESSAGE,
    type: 'order',
    orderId
  });
}

export async function sendPaymentFailedNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Payment Failed',
    body: PAYMENT_FAILED_MESSAGE,
    type: 'payment',
    orderId
  });
}

export async function sendOrderPackagedNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Order Packaged',
    body: ORDER_PACKAGED_MESSAGE,
    type: 'order',
    orderId
  });
}

export async function sendOrderOutForDeliveryNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Out for Delivery',
    body: ORDER_OUT_FOR_DELIVERY_MESSAGE,
    type: 'order',
    orderId
  });
}

export async function sendOrderDeliveredNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Order Delivered',
    body: ORDER_DELIVERED_MESSAGE,
    type: 'order',
    orderId
  });
}

export async function sendOrderCancelledNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Order Cancelled',
    body: ORDER_CANCELLED_MESSAGE,
    type: 'order',
    orderId
  });
}

export async function sendRefundInitiatedNotification(userId: number, orderId?: string) {
  await scheduleNotification(userId, {
    title: 'Refund Initiated',
    body: REFUND_INITIATED_MESSAGE,
    type: 'refund',
    orderId
  });
}

process.on('SIGTERM', async () => {
  await notificationQueue.close();
  await notificationWorker.close();
});