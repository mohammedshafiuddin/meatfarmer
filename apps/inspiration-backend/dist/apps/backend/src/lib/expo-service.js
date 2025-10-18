"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationsMany = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const env_exporter_1 = require("./env-exporter");
const expo = new expo_server_sdk_1.Expo({
    accessToken: env_exporter_1.expoAccessToken,
    useFcmV1: true,
});
const sendPushNotificationsMany = async (args) => {
    // const { pushToken, title, body, data } = args;
    const notifPayloads = args.map((arg) => ({
        to: arg.pushToken,
        title: arg.title,
        body: arg.body,
        data: arg.data,
        sound: "default",
        priority: "high",
    }));
    const chunks = expo.chunkPushNotifications(notifPayloads);
    let tickets = [];
    (async () => {
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error(error);
            }
        }
    })();
};
exports.sendPushNotificationsMany = sendPushNotificationsMany;
