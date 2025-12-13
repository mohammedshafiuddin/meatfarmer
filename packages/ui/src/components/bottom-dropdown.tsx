import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomDialog } from './dialog';
import tw from '../lib/tailwind';
import { theme } from '../theme';

export interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface BottomDropdownProps {
  label: string;
  value: string | number | string[] | number[];
  options: DropdownOption[];
  onValueChange: (value: string | number | string[] | number[]) => void;
  multiple?: boolean;
  error?: boolean;
  style?: any;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerComponent?: React.ComponentType<{
    onPress: () => void;
    disabled?: boolean;
    displayText: string;
  }>;
  onSearch?: (query: string) => void;
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
  triggerComponent,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounced search function
  const debouncedOnSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      onSearch?.(query);
    }, 2000);
  }, [onSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setSearchQuery(''); // Clear search when done
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
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
      {triggerComponent ? (
        React.createElement(triggerComponent, {
          onPress: () => !disabled && setIsOpen(true),
          disabled,
          displayText: getDisplayText(),
        })
      ) : (
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
      )}

      <BottomDialog open={isOpen} onClose={() => {
        setIsOpen(false);
        setSearchQuery(''); // Clear search when closed
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      }}>
        <View style={tw`py-4`}>
          <Text style={tw`text-lg font-semibold mb-4 text-center`}>{label}</Text>

          {/* Search Input - Fixed at top */}
          {onSearch && (
            <View style={tw`px-4 pb-2 border-b border-gray-200 mb-2`}>
              <TextInput
                style={tw`border border-gray-300 rounded-md px-3 py-2 text-base`}
                placeholder="Search options..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  debouncedOnSearch(text);
                }}
                autoFocus={true}
                clearButtonMode="while-editing"
              />
            </View>
          )}

          <ScrollView style={tw`max-h-80`}>
            {filteredOptions.length === 0 && searchQuery ? (
              <View style={tw`py-8 px-4 items-center`}>
                <Text style={tw`text-gray-500 text-center`}>
                  No options found for "{searchQuery}"
                </Text>
              </View>
            ) : (
              filteredOptions.map((option) => {
              const selected = isSelected(option.value);
              const isDisabled = option.disabled || disabled;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    tw`px-4 py-3 rounded-md my-1 mx-2 flex-row items-center justify-between`,
                    selected ? { backgroundColor: theme.colors.pink2 } : tw`bg-transparent`,
                    isDisabled && tw`opacity-50`,
                  ]}
                  onPress={() => !isDisabled && handleSelect(option.value)}
                  disabled={isDisabled}
                >
                   <Text
                      style={[
                        selected ? tw`text-pink-800 font-semibold` : tw`text-gray-800`,
                        isDisabled && tw`text-gray-400`,
                      ]}
                    >
                     {(() => {
                       const labelStr = option.label as string;
                       const [code, rest] = labelStr.split(' - ', 2);
                       return (
                         <>
                           <Text style={tw`font-bold`}>{code}</Text>
                           {rest ? ` - ${rest}` : ''}
                         </>
                       );
                     })()}
                   </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={20} color="#FA7189" />
                  )}
                </TouchableOpacity>
               );
             })
            )}
          </ScrollView>
          {multiple && (
            <View style={tw`flex-row justify-between mt-4 px-4`}>
              <TouchableOpacity
                style={[tw`px-4 py-2 rounded-md flex-1 mr-2`, { backgroundColor: theme.colors.brand500 }]}
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