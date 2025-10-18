import Toast from "react-native-toast-message";
import React from "react";
import { useRouter } from "expo-router";

export function InfoToast(message: string) {
  Toast.show({
    type: "info",
    text1: message,
    position: "top",
    visibilityTime: 10000,
    onPress: () => {
      Toast.hide();
    },
  });
}

export function ErrorToast(message: string) {
  Toast.show({
    type: "error",
    text1: message,
    position: "top",
    onPress: () => {
      Toast.hide();
    },
  });
}

export function SuccessToast(message: string) {
  Toast.show({
    type: "success",
    text1: message,
    position: "top",
    onPress: () => {
      Toast.hide();
    },
  });
}

export function NotificationToast(title: string, subtitle: string, data: any) {
  const router = useRouter();
  Toast.show({
    type: "info",
    text1: title,
    text2: subtitle,
    position: "top",
    onPress: () => {
      if (data && data.rideId) {
        // router.push(`/(drawer)/dashboard/ride-details?id=${data.rideId}`);
      } else if (data && data.carId) {
        // router.push(`/(drawer)/my-cars/car-details?id=${data.carId}`);
      }
      Toast.hide();
    },
  });
}

export default Toast;
