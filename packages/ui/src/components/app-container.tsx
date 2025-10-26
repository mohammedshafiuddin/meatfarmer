import tw from "../lib/tailwind";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

interface Props {
  children: React.ReactNode;
}

function AppContainer(props: Props) {
  const { children } = props;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-gray1 dark:bg-gray-900`}
      keyboardVerticalOffset={80}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={tw`p-4 flex-grow`}>
        {children}
        <View style={tw`h-16`}></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default AppContainer;
