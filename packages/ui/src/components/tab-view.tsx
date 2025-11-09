import React from 'react';
import { TabView, TabViewProps, Route, TabBar } from 'react-native-tab-view';
import { useTheme } from 'common-ui';

interface TabViewWrapperProps extends TabViewProps<Route> {
  // Additional props can be added here if needed
}

const TabViewWrapper: React.FC<TabViewWrapperProps> = (props) => {
  const { theme } = useTheme();

  const renderTabBar = (tabBarProps: any) => (
    <TabBar
      {...tabBarProps}
      indicatorStyle={{ backgroundColor: theme.colors.blue1 }}
      style={{ backgroundColor: theme.colors.white1 }}
      labelStyle={{ color: theme.colors.black1 }}
      activeColor={theme.colors.blue1}
      inactiveColor={theme.colors.black1}
    />
  );

  return <TabView {...props} renderTabBar={renderTabBar} />;
};

export default TabViewWrapper;