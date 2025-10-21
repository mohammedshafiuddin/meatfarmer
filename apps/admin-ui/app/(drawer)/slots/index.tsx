import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useTheme } from 'common-ui';
import AddRemoveTab from './AddRemoveTab';
import AvailabilityTab from './AvailabilityTab';

const initialLayout = { width: Dimensions.get('window').width };

export default function SlotsPage() {
  const [index, setIndex] = useState(0);
  const { theme } = useTheme();

  const [routes] = useState([
    { key: 'addRemove', title: 'Add / Remove' },
    { key: 'availability', title: 'Availability' },
  ]);

  const renderScene = SceneMap({
    addRemove: AddRemoveTab,
    availability: AvailabilityTab,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.blue1 }}
      style={{ backgroundColor: theme.colors.white1 }}
      labelStyle={{ color: theme.colors.black1 }}
      activeColor={theme.colors.blue1}
      inactiveColor={theme.colors.gray1}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
      />
    </View>
  );
}