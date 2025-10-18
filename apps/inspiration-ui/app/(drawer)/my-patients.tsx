import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MyText, tw, BottomDialog, SearchBar, MyTextInput } from 'common-ui';
import AppContainer from '@/components/app-container';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import MyPatients from '@/components/my-patients';

export default function MyPatientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  return (
    <ThemedView style={tw`flex-1`}>
      <View style={tw`p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`}>
        <MyText style={tw`text-xl font-bold text-gray-800 dark:text-white`}>My Patients</MyText>
        <MyText style={tw`text-gray-600 dark:text-gray-400`}>Manage and view your patients</MyText>
      </View>

      <AppContainer>
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={tw`flex-1`}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={() => {}}
                placeholder="Search by name, mobile, gender..."
              />
            </View>
            <TouchableOpacity onPress={() => setFilterVisible(true)} style={tw`p-2 ml-2`}>
              <Ionicons name="filter" size={24} color={tw.color('gray-600')} />
            </TouchableOpacity>
          </View>
        </View>

        <BottomDialog open={isFilterVisible} onClose={() => setFilterVisible(false)}>
          <View style={tw``}>
            <MyText style={tw`text-lg font-bold mb-4`}>Filter Options</MyText>

            <MyText style={tw`text-base font-semibold mb-2`}>By Gender</MyText>
            <View style={tw`flex-row mb-2`}>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg mr-2`}>
                <MyText>Male</MyText>
              </TouchableOpacity>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg mr-2`}>
                <MyText>Female</MyText>
              </TouchableOpacity>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg`}>
                <MyText>Other</MyText>
              </TouchableOpacity>
            </View>

            <MyText style={tw`text-base font-semibold mt-4 mb-2`}>By Age Range</MyText>
            <View style={tw`flex-row justify-between mb-2`}>
              <View style={tw`w-[48%]`}>
                <MyTextInput
                  placeholder="Min Age"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={tw`w-[48%]`}>
                <MyTextInput
                  placeholder="Max Age"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <MyText style={tw`text-base font-semibold mt-4 mb-2`}>By Last Consultation</MyText>
            <View style={tw`flex-row mb-2`}>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg mr-2`}>
                <MyText>Last Week</MyText>
              </TouchableOpacity>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg mr-2`}>
                <MyText>Last Month</MyText>
              </TouchableOpacity>
              <TouchableOpacity style={tw`px-4 py-2 bg-blue-100 rounded-lg`}>
                <MyText>Last 6 Months</MyText>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row justify-end border-t border-gray-200 pt-4 mt-auto`}>
              <TouchableOpacity
                onPress={() => {
                  // Clear filters
                  setSearchQuery('');
                  setActiveFilters({});
                  setFilterVisible(false);
                }}
                style={tw`px-4 py-2 mr-2`}
              >
                <MyText style={tw`text-gray-600`}>Clear</MyText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterVisible(false)}
                style={tw`bg-blue-600 px-4 py-2 rounded-lg`}
              >
                <MyText style={tw`text-white font-bold`}>Apply</MyText>
              </TouchableOpacity>
            </View>
          </View>
        </BottomDialog>

        <MyPatients searchQuery={searchQuery} filters={activeFilters} />
      </AppContainer>
    </ThemedView>
  );
}