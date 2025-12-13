import React from "react";
import { useNotification } from "./notif-context";
import { BottomDialog } from "common-ui";
import { MyText } from "common-ui";
import { View, Linking } from "react-native";
import { tw } from "common-ui";
import { MyButton } from "common-ui";
import { useAuth } from "@/components/context/auth-context";

interface Props {}

function NotifChecker(props: Props) {
  const {} = props;
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);

  const {isLoggedIn} = useAuth();
  // const { data: hasPushToken, isLoading, isError } = useHasPushToken({enabled: isLoggedIn});
  const hasPushToken = false;
  // const { mutate: addPushToken } = useAddPushToken();
  const addPushToken = (input:any) => {};
  const { notifPermission, expoPushToken } = useNotification();
  React.useEffect(() => {
    if(isLoggedIn && !hasPushToken && notifPermission =='granted') {
        addPushToken(expoPushToken!);
    }
  },[isLoggedIn, hasPushToken])

  React.useEffect(() => {
    if (notifPermission === "denied") {
      setShowPermissionDialog(true);
    }
  }, [notifPermission]);

  return (
    <>
      <BottomDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
      >
        <View style={tw`flex flex-col h-64 p-4`}>
          <MyText weight="semibold" color="red1" style={tw`mb-2 text-lg`}>
            Notification Permission Denied
          </MyText>
          <MyText>
            It seems you have denied notification permissions. Please enable
            them in your device settings.
          </MyText>
          <View style={tw`flex flex-row gap-3 mt-auto justify-center`}>
            <MyButton
              fillColor="red1"
              onPress={() => setShowPermissionDialog(false)}
              style={tw`flex-1`}
            >
              Cancel
            </MyButton>
            <MyButton
              fillColor="brand500"
              onPress={() => {
                Linking.openSettings();
              }}
              style={tw`flex-1`}
            >
              Settings
            </MyButton>
          </View>
        </View>
      </BottomDialog>
    </>
  );
}

export default NotifChecker;
