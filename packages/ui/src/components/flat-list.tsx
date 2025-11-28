import React from 'react';
import { FlatList, FlatListProps, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefresh } from '../lib/refresh-context';

const MyFlatList = <T,>(props: FlatListProps<T> & { onRefresh?: () => void }) => {
  const { refreshAll } = useRefresh();
  const { onRefresh, ...restProps } = props;
  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <FlatList
        {...restProps}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh || refreshAll} />}
      />
    </View>
  );
};

export default MyFlatList;