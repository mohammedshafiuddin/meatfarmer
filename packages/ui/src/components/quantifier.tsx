import React from 'react';
import { View, TouchableOpacity, Text, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { colors } from '../lib/theme-colors';

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
    <View style={tw`flex-row items-center bg-brand50 rounded-lg border border-brand300 px-1.5`}>
       <TouchableOpacity
         style={tw`justify-center items-center`}
         onPress={() => setValue(Math.max(0, value - step))}
       >
         <MaterialIcons name="remove" size={16} color={colors.brand500} />
       </TouchableOpacity>
       <TextInput
         style={tw`text-center w-7 text-black font-medium text-sm`}
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
         style={tw` justify-center items-center`}
         onPress={() => setValue(value + step)}
       >
         <MaterialIcons name="add" size={16} color={colors.brand500} />
       </TouchableOpacity>
     </View>
  );
};

export default Quantifier;