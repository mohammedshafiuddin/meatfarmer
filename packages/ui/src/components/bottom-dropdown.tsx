import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomDialog } from './dialog';
import  MyText  from './text';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface BottomDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  labelField?: string;
  valueField?: string;
  style?: any;
  placeholderStyle?: any;
  selectedTextStyle?: any;
  optionContainerStyle?: any;
  optionStyle?: any;
  disabled?: boolean;
}

const BottomDropdown: React.FC<BottomDropdownProps> = ({
  options:data,
  value,
  onChange,
  placeholder = 'Select option',
  labelField = 'label',
  valueField = 'value',
  style,
  placeholderStyle,
  selectedTextStyle,
  optionContainerStyle,
  optionStyle,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = data.find(option => option.value === value);

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    setIsVisible(false);
  };

  const handlePress = () => {
    if (!disabled) {
      setIsVisible(true);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity style={styles.dropdownContainer} onPress={handlePress} disabled={disabled}>
        {selectedOption ? (
          <MyText style={[styles.selectedText, selectedTextStyle]}>
            {selectedOption[labelField as keyof DropdownOption]}
          </MyText>
        ) : (
          <MyText style={[styles.placeholderText, placeholderStyle]}>
            {placeholder}
          </MyText>
        )}
        <MyText style={styles.arrow}>{'▼'}</MyText>
      </TouchableOpacity>

      <BottomDialog open={isVisible} onClose={() => setIsVisible(false)}>
        <View style={[styles.optionsContainer, optionContainerStyle]}>
          <MyText style={styles.title}>Select Option</MyText>
          {data.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                optionStyle,
                value === option.value && styles.selectedOption
              ]}
              onPress={() => handleSelect(option)}
            >
              <Text style={[
                styles.optionText, 
                value === option.value && styles.selectedOptionText
              ]}>
                {option[labelField as keyof DropdownOption]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#4361ee',
  },
});

export default BottomDropdown;
