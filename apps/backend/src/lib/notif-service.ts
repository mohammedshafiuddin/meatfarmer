import { db } from "../db/db_index";
import { sendPushNotificationsMany } from "./expo-service";
// import { usersTable, notifCredsTable, notificationTable } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

// Core notification dispatch methods (renamed for clarity)
export async function dispatchBulkNotification({
  userIds = [],
  pushTokens = [],
  title,
  body,
  data,
}: {
  userIds?: number[];
  pushTokens?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  try {
    let allPushTokens: string[] = [];

    // Add provided pushTokens directly
    if (pushTokens && pushTokens.length > 0) {
      allPushTokens.push(...pushTokens.filter(Boolean));
    }

    // Fetch push tokens for userIds
    // if (userIds && userIds.length > 0) {
    //   const tokensFromDb = await db.query.notifCredsTable.findMany({
    //     where: inArray(notifCredsTable.userId, userIds),
    //     columns: { pushToken: true },
    //   });
    //   allPushTokens.push(
    //     ...tokensFromDb.map((t) => t.pushToken).filter(Boolean)
    //   );
    // }

    // Remove duplicates
    allPushTokens = Array.from(new Set(allPushTokens));

    if (allPushTokens.length === 0) {
      console.warn(`No push tokens found for users: ${userIds?.join(", ")}`);
      return;
    }

    const messages = allPushTokens.map((pushToken) => ({
      pushToken,
      title,
      body,
      data,
    }));
    await sendPushNotificationsMany(messages);
  } catch (error) {
    console.error("Error dispatching bulk notifications:", error);
    throw new Error("Failed to dispatch notifications");
  }
}

// Helper to dispatch notification to a single user or pushToken
export async function dispatchUserNotification({
  userId,
  pushToken,
  title,
  body,
  data,
}: {
  userId?: number;
  pushToken?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  // Add entry to notificationTable if userId is provided
  if (userId) {
    try {
      // await db.insert(notificationTable).values({
      //   userId,
      //   title,
      //   body,
      //   payload: data,
      //   // addedOn will default to now
      // });
    } catch (err) {
      console.error('Failed to insert notificationTable entry:', err);
    }
  }
  console.log({pushToken, userId}, 'dispatching notification to single user')

  await dispatchBulkNotification({
    userIds: userId ? [userId] : [],
    pushTokens: pushToken ? [pushToken] : [],
    title,
    body,
    data,
  });
}

// =============================================================================
// PURPOSE-SPECIFIC NOTIFICATION METHODS
// =============================================================================

// Order-related notifications
export const notifyOrderPlaced = (orderId: number, userId: number) =>
  dispatchUserNotification({
    title: 'Order Placed Successfully! 🎉',
    body: `Your order #${orderId} has been placed and is being processed.`,
    userId,
    data: { orderId, type: 'order_placed' }
  });

export const notifyOrderConfirmed = (orderId: number, userId: number) =>
  dispatchUserNotification({
    title: 'Order Confirmed! ✅',
    body: `Your order #${orderId} has been confirmed and is being prepared.`,
    userId,
    data: { orderId, type: 'order_confirmed' }
  });

export const notifyOrderReady = (orderId: number, userId: number) =>
  dispatchUserNotification({
    title: 'Order Ready for Pickup! 🍽️',
    body: `Your order #${orderId} is ready for pickup.`,
    userId,
    data: { orderId, type: 'order_ready' }
  });

export const notifyOrderCancelled = (orderId: number, userId: number, reason?: string) =>
  dispatchUserNotification({
    title: 'Order Cancelled ❌',
    body: `Your order #${orderId} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    userId,
    data: { orderId, type: 'order_cancelled', reason }
  });

// Delivery notifications
export const notifyDeliveryAssigned = (orderId: number, userId: number, deliveryPerson: string) =>
  dispatchUserNotification({
    title: 'Delivery Partner Assigned 🚚',
    body: `${deliveryPerson} will deliver your order #${orderId}.`,
    userId,
    data: { orderId, deliveryPerson, type: 'delivery_assigned' }
  });

export const notifyOutForDelivery = (orderId: number, userId: number, eta: string) =>
  dispatchUserNotification({
    title: 'Out for Delivery! 📦',
    body: `Your order #${orderId} is out for delivery. Expected arrival: ${eta}`,
    userId,
    data: { orderId, eta, type: 'out_for_delivery' }
  });

export const notifyDelivered = (orderId: number, userId: number) =>
  dispatchUserNotification({
    title: 'Order Delivered! 🎊',
    body: `Your order #${orderId} has been delivered successfully.`,
    userId,
    data: { orderId, type: 'delivered' }
  });

// Payment notifications
export const notifyPaymentSuccess = (orderId: number, userId: number, amount: number) =>
  dispatchUserNotification({
    title: 'Payment Successful 💳',
    body: `Payment of ₹${amount} for order #${orderId} was successful.`,
    userId,
    data: { orderId, amount, type: 'payment_success' }
  });

export const notifyPaymentFailed = (orderId: number, userId: number) =>
  dispatchUserNotification({
    title: 'Payment Failed ❌',
    body: `Payment for order #${orderId} failed. Please try again.`,
    userId,
    data: { orderId, type: 'payment_failed' }
  });

export const notifyRefundProcessed = (orderId: number, userId: number, amount: number) =>
  dispatchUserNotification({
    title: 'Refund Processed 💰',
    body: `Refund of ₹${amount} for order #${orderId} has been processed.`,
    userId,
    data: { orderId, amount, type: 'refund_processed' }
  });

// Promotional notifications
export const notifyNewOffer = (userIds: number[], offerTitle: string, offerDetails: string) =>
  dispatchBulkNotification({
    title: `New Offer: ${offerTitle} 🎁`,
    body: offerDetails,
    userIds,
    data: { type: 'promotion', offerTitle }
  });

export const notifyFlashSale = (userIds: number[], productName: string, discount: number) =>
  dispatchBulkNotification({
    title: 'Flash Sale! ⚡',
    body: `Get ${discount}% off on ${productName}. Limited time offer!`,
    userIds,
    data: { type: 'flash_sale', productName, discount }
  });

export const notifyLoyaltyPointsEarned = (userId: number, points: number, reason: string) =>
  dispatchUserNotification({
    title: 'Loyalty Points Earned! ⭐',
    body: `You earned ${points} points for ${reason}.`,
    userId,
    data: { points, reason, type: 'loyalty_points' }
  });

// Account notifications
export const notifyWelcome = (userId: number, userName: string) =>
  dispatchUserNotification({
    title: 'Welcome to Meat Farmer! 🥩',
    body: `Hi ${userName}, welcome to our fresh meat delivery service.`,
    userId,
    data: { type: 'welcome' }
  });

export const notifyPasswordReset = (userId: number) =>
  dispatchUserNotification({
    title: 'Password Reset Successful 🔐',
    body: 'Your password has been reset successfully.',
    userId,
    data: { type: 'password_reset' }
  });

export const notifyAccountVerified = (userId: number) =>
  dispatchUserNotification({
    title: 'Account Verified! ✅',
    body: 'Your account has been successfully verified.',
    userId,
    data: { type: 'account_verified' }
  });

// =============================================================================
// BACKWARD COMPATIBILITY (DEPRECATED)
// =============================================================================

/**
 * @deprecated Use notifyOrderConfirmed() or other purpose-specific methods instead
 */
export const sendNotifToSingleUser = dispatchUserNotification;

/**
 * @deprecated Use notifyNewOffer() or other purpose-specific methods instead
 */
export const sendNotifToManyUsers = dispatchBulkNotification;