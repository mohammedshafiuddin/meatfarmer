import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

const MyFlatList = <T,>(props: FlatListProps<T>) => {
  return <FlatList {...props} />;
};

export default MyFlatList;