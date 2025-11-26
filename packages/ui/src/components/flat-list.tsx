import React from 'react';
import { FlatList, FlatListProps, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefresh } from '../lib/refresh-context';

const MyFlatList = <T,>(props: FlatListProps<T>) => {
  const { refreshAll } = useRefresh();
  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <FlatList
        {...props}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} />}
      />
    </View>
  );
};

export default MyFlatList;