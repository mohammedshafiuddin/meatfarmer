import { Expo } from "expo-server-sdk";
import { title } from "process";
import { expoAccessToken } from "./env-exporter";

const expo = new Expo({
  accessToken: expoAccessToken,
  useFcmV1: true,
});

type NotificationArgs = {
  pushToken: string;
  title?: string;
  body?: string;
  data: Record<string, unknown> | undefined;
  // data?: object;
};

export const sendPushNotificationsMany = async (args: NotificationArgs[]) => {
  // const { pushToken, title, body, data } = args;
  const notifPayloads = args.map((arg) => ({
    to: arg.pushToken,
    title: arg.title,
    body: arg.body,
    data: arg.data,
    sound: "default",
    priority: "high" as any,
  }));
  const chunks = expo.chunkPushNotifications(notifPayloads);

  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
