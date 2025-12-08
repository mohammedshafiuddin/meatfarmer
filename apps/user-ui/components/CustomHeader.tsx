import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { tw, theme } from 'common-ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CustomHeader = () => {
  const router = useRouter();

  return (
    <View style={[tw`flex-row items-center justify-between pt-8 pb-4 px-4 shadow-sm`, { backgroundColor: theme.colors.gray1 }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.gray2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialIcons name="chevron-left" size={24} color="black" />
      </TouchableOpacity>
      <View style={tw`flex-row`}>
        <TouchableOpacity
          onPress={() => router.push('/(drawer)/(tabs)/cart')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.gray2,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}
        >
          <MaterialIcons name="shopping-cart" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(drawer)/(tabs)/me')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.gray2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="person" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomHeader;