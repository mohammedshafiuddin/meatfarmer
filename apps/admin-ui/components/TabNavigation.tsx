import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MyText , tw } from "common-ui";

interface TabNavigationProps {
  tabs: { key: string; title: string }[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={tw`flex-row bg-gray-100 rounded-xl p-1 mb-4`}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            tw`flex-1 py-3 px-4 rounded-xl`,
            activeTab === tab.key ? tw`bg-white shadow` : tw``
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <MyText
            style={[
              tw`text-center font-medium`,
              activeTab === tab.key ? tw`text-blue-600` : tw`text-gray-500`
            ]}
          >
            {tab.title}
          </MyText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TabNavigation;