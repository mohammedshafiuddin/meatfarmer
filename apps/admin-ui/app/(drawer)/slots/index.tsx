import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { SceneMap } from 'react-native-tab-view';
import { TabViewWrapper, AppContainer } from 'common-ui';
import AddRemoveTab from './AddRemoveTab';
import AvailabilityTab from './AvailabilityTab';

const initialLayout = { width: Dimensions.get('window').width };

export default function SlotsPage() {
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'addRemove', title: 'Add / Remove' },
    { key: 'availability', title: 'Availability' },
  ]);

  const renderScene = SceneMap({
    addRemove: AddRemoveTab,
    availability: AvailabilityTab,
  });

  return (
    <AppContainer>
      <View style={{ flex: 1 }}>
      <TabViewWrapper
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
      />
    </View>
  </AppContainer>
  );
}