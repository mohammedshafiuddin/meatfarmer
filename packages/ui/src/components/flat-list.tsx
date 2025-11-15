import React from 'react';
import { FlatList, FlatListProps, View } from 'react-native';

const MyFlatList = <T,>(props: FlatListProps<T>) => {
  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <FlatList {...props} />
    </View>
  );
};

export default MyFlatList;