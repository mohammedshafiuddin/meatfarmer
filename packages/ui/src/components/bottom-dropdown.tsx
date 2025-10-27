import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomDialog } from './dialog';
import tw from '../lib/tailwind';
import { theme } from '../theme';

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface BottomDropdownProps {
  label: string;
  value: string | number | string[];
  options: DropdownOption[];
  onValueChange: (value: string | number | string[]) => void;
  multiple?: boolean;
  error?: boolean;
  style?: any;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const BottomDropdown: React.FC<BottomDropdownProps> = ({
  label,
  value,
  options,
  onValueChange,
  multiple = false,
  error,
  style,
  placeholder,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayText = () => {
    if (multiple) {
      const selectedValues = value as string[];
      if (selectedValues.length === 0) return placeholder ?? label;

      const selectedLabels = options
        .filter(option => selectedValues.includes(option.value as string))
        .map(option => option.label);

      return selectedLabels.length > 0 ? selectedLabels.join(', ') : (placeholder ?? label);
    } else {
      const selectedOption = options.find(option => option.value === value);
      return selectedOption ? selectedOption.label : (placeholder ?? label);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = value as string[];
      const newValues = currentValues.includes(optionValue as string)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue as string];
      onValueChange(newValues);
    } else {
      onValueChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleDone = () => {
    setIsOpen(false);
  };

  const isSelected = (optionValue: string | number) => {
    if (multiple) {
      return (value as string[]).includes(optionValue as string);
    } else {
      return value === optionValue;
    }
  };

  return (
    <View style={[tw``, style]}>
      <TouchableOpacity
        style={[
          tw`border rounded-md px-3 py-2 flex-row items-center justify-between`,
          error ? tw`border-red-500` : tw`border-gray-300`,
          disabled && tw`bg-gray-100 border-gray-200`,
          tw`${className || ''}`,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            tw`flex-1`,
            (multiple ? (value as string[]).length > 0 : options.some(opt => opt.value === value))
              ? tw`text-gray-900 font-medium`
              : tw`text-gray-500`,
            disabled && tw`text-gray-400`,
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={disabled ? '#9ca3af' : '#6b7280'}
          style={tw`ml-2`}
        />
      </TouchableOpacity>

      <BottomDialog open={isOpen} onClose={() => setIsOpen(false)}>
        <View style={tw`py-4`}>
          <Text style={tw`text-lg font-semibold mb-4 text-center`}>{label}</Text>
          <ScrollView style={tw`max-h-80`}>
            {options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    tw`px-4 py-3 rounded-md my-1 mx-2 flex-row items-center justify-between`,
                    selected ? { backgroundColor: theme.colors.pink2 } : tw`bg-transparent`,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      selected ? tw`text-pink-800 font-semibold` : tw`text-gray-800`,
                      disabled && tw`text-gray-400`,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={20} color="#FA7189" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {multiple && (
            <View style={tw`flex-row justify-between mt-4 px-4`}>
              <TouchableOpacity
                style={[tw`px-4 py-2 rounded-md flex-1 mr-2`, { backgroundColor: theme.colors.pink1 }]}
                onPress={handleDone}
              >
                <Text style={tw`text-white text-center font-medium`}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BottomDialog>
    </View>
  );
};

export default BottomDropdown;