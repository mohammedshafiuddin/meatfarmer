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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never" // remove automatic padding
      >
        <View style={[tw`px-4`,{ flex: 1, backgroundColor: "#fff" }]}>
          {children}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
  return (
    // <KeyboardAvoidingView
    //   behavior={Platform.OS === "ios" ? "padding" : "height"}
    //   style={tw`flex-1 bg-gray1 dark:bg-gray-900`}
    //   keyboardVerticalOffset={150}
    // >
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid
      extraScrollHeight={20} // scrolls input above keyboard
    >
      {/* <ScrollView contentContainerStyle={tw`p-4`}> */}
        {children}
        {/* <View style={tw`h-16`}></View> */}
      {/* </ScrollView> */}
      {/* </KeyboardAvoidingView> */}
    </KeyboardAwareScrollView>
  );
}

export default AppContainer;
