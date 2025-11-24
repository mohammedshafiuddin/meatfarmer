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
        style={tw`bg-gray2 w-8 h-8 flex-row rounded-full  justify-center items-center`}
        onPress={() => setValue(Math.max(0, value - step))}
      >
        <Text style={tw`text-lg font-bold text-black`}>-</Text>
      </TouchableOpacity>
      <TextInput
        style={tw`underline py-2 text-center w-8`}
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
        style={tw`bg-gray2 w-8 h-8 rounded-full ml-1 justify-center items-center`}
        onPress={() => setValue(value + step)}
      >
        <Text style={tw`text-lg font-bold`}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Quantifier;