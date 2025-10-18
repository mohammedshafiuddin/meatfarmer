import React from 'react';
import { View, TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import MyText from './text';
import tw from '../lib/tailwind';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search...',
  containerStyle,
}) => {
  return (
    <View style={[tw`flex-row`, containerStyle]}>
      <TextInput
        style={tw`flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-base`}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        style={tw`bg-blue-600 px-4 justify-center rounded-r-lg`}
        onPress={onSearch}
      >
        <MyText style={tw`text-white font-bold`}>Search</MyText>
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;
