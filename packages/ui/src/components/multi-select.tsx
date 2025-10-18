import React from 'react';
import { ImageStyle, StyleSheet, TextStyle, View, ViewStyle, Text } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface MultiSelectDropdownProps {
  data: DropdownOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  labelField?: string;
  valueField?: string;
  style?: ViewStyle;
  dropdownStyle?: ViewStyle;
  placeholderStyle?: TextStyle;
  selectedTextStyle?: TextStyle;
  inputSearchStyle?: TextStyle;
  iconStyle?: ImageStyle;
  search?: boolean;
  maxHeight?: number;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  data,
  value,
  onChange,
  placeholder = 'Select',
  labelField = 'label',
  valueField = 'value',
  style,
  dropdownStyle,
  placeholderStyle,
  selectedTextStyle,
  inputSearchStyle,
  iconStyle,
  search = true,
  maxHeight = 300,
  disabled = false,
}) => {
  return (
    <View style={style}>
      <MultiSelect
        style={[styles.dropdown, dropdownStyle]}
        placeholderStyle={[styles.placeholderStyle, placeholderStyle]}
        selectedTextStyle={[styles.selectedTextStyle, selectedTextStyle]}
        inputSearchStyle={[styles.inputSearchStyle, inputSearchStyle]}
        iconStyle={[styles.iconStyle, iconStyle]}
        data={data}
        search={search}
        maxHeight={maxHeight}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disable={disabled}
        renderItem={(item: DropdownOption) => {
          const isSelected = value.includes(item.value);
          return (
            <View style={[styles.item, isSelected && styles.selectedItem]}> 
              <Text style={isSelected ? styles.selectedTextStyle : styles.itemTextStyle}>
                {item.label}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    color: '#888',
    fontSize: 16,
  },
  selectedTextStyle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemTextStyle: {
    color: '#333',
    fontSize: 16,
  },
  inputSearchStyle: {
    color: '#333',
    fontSize: 16,
  },
  iconStyle: {
    width: 24,
    height: 24,
  } as ImageStyle,
  item: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: '#e0f0ff', // Light blue for selected
  },
});

export default MultiSelectDropdown;
