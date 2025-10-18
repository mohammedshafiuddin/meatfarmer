import tw from "../lib/tailwind";
import React from "react";
import { Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface Props {
  label: string;
  value: string | number;
  options: DropdownOption[];
  onValueChange: (value: string | number) => void;
  error?: boolean;
  style?: any;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CustomDropdown: React.FC<Props> = ({
  label,
  value,
  options,
  onValueChange,
  error,
  style,
  placeholder,
  disabled,
  className,
}) => {
  return (
    <View style={[tw``, style]}>
      <Dropdown
        data={options}
        labelField="label"
        valueField="value"
        value={value}
        onChange={(item) => onValueChange(item.value)}
        placeholder={placeholder ?? label}
        placeholderStyle={[tw`text-gray-500`, disabled && tw`text-gray-400`]}
        style={[
          tw`border rounded-md px-3 py-2 bg-white`,
          error ? tw`border-red-500` : tw`border-gray-300`,
          disabled && tw`bg-gray-100 border-gray-200`,
          tw`${className || ''}`,
        ]}
        disable={disabled}
        renderItem={(item: DropdownOption) => {
          const isSelected = value === item.value;
          return (
            <View
              style={[
                tw`px-3 py-2 rounded-md my-1`,
                isSelected ? tw`bg-blue-50` : tw`bg-white`,
              ]}
            >
              <Text
                style={[
                  isSelected ? tw`text-blue-800 font-semibold` : tw`text-gray-800`,
                  disabled && tw`text-gray-400`,
                ]}
              >
                {item.label}
              </Text>
            </View>
          );
        }}
        selectedTextStyle={disabled ? tw`text-gray-400` : tw`text-gray-800 font-medium`}
        // the dropdown's listProps / containerProps can be tuned if needed:
        // dropdownStyle etc. Example:
        // dropdownStyle={tw`bg-white`}
      />
    </View>
  );
};

export default CustomDropdown;
