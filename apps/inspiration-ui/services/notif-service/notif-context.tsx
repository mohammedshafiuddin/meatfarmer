import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./notif-register";
import { useRouter } from "expo-router";
import { NotificationToast } from "../toaster";
import { NOTIF_PERMISSION_DENIED } from "common-ui/src/lib/const-strs";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  notifPermission: 'pending' | 'granted' | 'denied'
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [notifPermission, setNotifPermission] = React.useState<NotificationContextType["notifPermission"]>("pending");

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token);
        setNotifPermission("granted");
      })
      .catch((errorRaw) => {
        
        const err = String(errorRaw).slice(7); //remove the "Error: " string component in beginning
        
        if (err === NOTIF_PERMISSION_DENIED) {
          setNotifPermission("denied");
        }
      });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        // Show a visible toast when app is in foreground
        const content = notification.request?.content;
        if (content) {
          NotificationToast(
            content.title || "Notification",
            content.body || "",
            content.data || {}
          );
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data && data.doctorId) {
          router.push(`/(drawer)/dashboard`);
        } else if (data && data.tokenId) {
          router.push(`/(drawer)/dashboard`);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error, notifPermission }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
