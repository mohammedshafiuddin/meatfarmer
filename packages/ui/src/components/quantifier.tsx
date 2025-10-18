import React from 'react';
import { View, TouchableOpacity, Text, TextInput } from 'react-native';
import tw from '../lib/tailwind';

interface QuantifierProps {
  value: number;
  setValue: (value: number) => void;
  step?: number;
}

const Quantifier: React.FC<QuantifierProps> = ({
  value,
  setValue,
  step = 1,
}) => {
  return (
    <View style={tw`flex-row items-center`}>
      <TouchableOpacity
        style={tw`bg-gray-200 p-2 rounded-l`}
        onPress={() => setValue(Math.max(0, value - step))}
      >
        <Text style={tw`text-lg font-bold`}>-</Text>
      </TouchableOpacity>
      <TextInput
        style={tw`border border-gray-300 px-3 py-2 text-center w-16`}
        value={value.toString()}
        onChangeText={(text) => {
          const num = parseInt(text);
          if (!isNaN(num)) {
            setValue(num);
          }
        }}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={tw`bg-gray-200 p-2 rounded-r`}
        onPress={() => setValue(value + step)}
      >
        <Text style={tw`text-lg font-bold`}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Quantifier;