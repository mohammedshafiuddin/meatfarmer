import tw from "../lib/tailwind";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
}

function AppContainer(props: Props) {
  const { children } = props;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={tw`p-4 flex-1 bg-white`}>
        {children}
      </View>
    </KeyboardAwareScrollView>
  );
}

export default AppContainer;
