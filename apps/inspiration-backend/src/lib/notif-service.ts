import { db } from "../db/db_index";
import { sendPushNotificationsMany } from "./expo-service";
import { usersTable, notifCredsTable, notificationTable } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export async function sendNotifToManyUsers({
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
    if (userIds && userIds.length > 0) {
      const tokensFromDb = await db.query.notifCredsTable.findMany({
        where: inArray(notifCredsTable.userId, userIds),
        columns: { pushToken: true },
      });
      allPushTokens.push(
        ...tokensFromDb.map((t) => t.pushToken).filter(Boolean)
      );
    }

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
    console.error("Error sending notifications:", error);
    throw new Error("Failed to send notifications");
  }
}

// Helper to send notification to a single user or pushToken
export async function sendNotifToSingleUser({
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
      await db.insert(notificationTable).values({
        userId,
        title,
        body,
        payload: data,
        // addedOn will default to now
      });
    } catch (err) {
      console.error('Failed to insert notificationTable entry:', err);
    }
  }
  console.log({pushToken, userId}, 'sending notification to single user')
  
  await sendNotifToManyUsers({
    userIds: userId ? [userId] : [],
    pushTokens: pushToken ? [pushToken] : [],
    title,
    body,
    data,
  });
}