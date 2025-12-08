import React from 'react';
import { View, Text } from 'react-native';
import { AppContainer, tw } from 'common-ui';

export default function Info() {
  return (
    <AppContainer>
      <View style={tw`flex-1 justify-center items-center p-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-4`}>Hello World</Text>
        <Text style={tw`text-gray-600 text-center`}>
          This is the Info tab. More content can be added here later.
        </Text>
      </View>
    </AppContainer>
  );
}