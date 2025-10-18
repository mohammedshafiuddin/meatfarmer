"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifToManyUsers = sendNotifToManyUsers;
exports.sendNotifToSingleUser = sendNotifToSingleUser;
const db_index_1 = require("../db/db_index");
const expo_service_1 = require("./expo-service");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function sendNotifToManyUsers({ userIds = [], pushTokens = [], title, body, data, }) {
    try {
        let allPushTokens = [];
        // Add provided pushTokens directly
        if (pushTokens && pushTokens.length > 0) {
            allPushTokens.push(...pushTokens.filter(Boolean));
        }
        // Fetch push tokens for userIds
        if (userIds && userIds.length > 0) {
            const tokensFromDb = await db_index_1.db.query.notifCredsTable.findMany({
                where: (0, drizzle_orm_1.inArray)(schema_1.notifCredsTable.userId, userIds),
                columns: { pushToken: true },
            });
            allPushTokens.push(...tokensFromDb.map((t) => t.pushToken).filter(Boolean));
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
        await (0, expo_service_1.sendPushNotificationsMany)(messages);
    }
    catch (error) {
        console.error("Error sending notifications:", error);
        throw new Error("Failed to send notifications");
    }
}
// Helper to send notification to a single user or pushToken
async function sendNotifToSingleUser({ userId, pushToken, title, body, data, }) {
    // Add entry to notificationTable if userId is provided
    if (userId) {
        try {
            await db_index_1.db.insert(schema_1.notificationTable).values({
                userId,
                title,
                body,
                payload: data,
                // addedOn will default to now
            });
        }
        catch (err) {
            console.error('Failed to insert notificationTable entry:', err);
        }
    }
    console.log({ pushToken, userId }, 'sending notification to single user');
    await sendNotifToManyUsers({
        userIds: userId ? [userId] : [],
        pushTokens: pushToken ? [pushToken] : [],
        title,
        body,
        data,
    });
}
