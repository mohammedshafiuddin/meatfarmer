import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { tw, MyText, useManualRefresh, useMarkDataFetchers, MyFlatList } from 'common-ui';
import { TagMenu } from '@/src/components/TagMenu';
import { useGetTags, Tag } from '@/src/api-hooks/tag.api';

export default function ProductTags() {
  const router = useRouter();
  const { data: tagsData, isLoading, error, refetch } = useGetTags();
  const [refreshing, setRefreshing] = useState(false);

  const tags = tagsData?.tags || [];

  useManualRefresh(refetch);

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddNewTag = () => {
    router.push('/(drawer)/add-tag');
  };

  const renderTag = ({ item }: { item: Tag }) => (
    <View style={tw`bg-white rounded-2xl p-6 mx-4 mb-4 shadow-sm border border-gray-100`}>
      <View style={tw`flex-row justify-between items-start mb-4`}>
        <View style={tw`flex-1 flex-row items-start`}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={tw`w-16 h-16 rounded-lg mr-3 mt-1`}
              resizeMode="cover"
            />
          )}
          <View style={tw`flex-1`}>
            <MyText style={tw`text-lg font-bold text-gray-800`}>{item.tagName}</MyText>
            {item.tagDescription && (
              <MyText style={tw`text-sm text-gray-600 mt-1`}>{item.tagDescription}</MyText>
            )}
            {item.isDashboardTag && (
              <View style={tw`flex-row items-center mt-2`}>
                <MaterialIcons name="dashboard" size={14} color="#16A34A" />
                <MyText style={tw`text-xs text-green-700 ml-1`}>Dashboard Tag</MyText>
              </View>
            )}
          </View>
        </View>
        <TagMenu tagId={item.id} onDeleteSuccess={refetch} />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={tw`flex-row justify-between items-center p-4 bg-white border-b border-gray-200`}>
      <MyText style={tw`text-xl font-bold text-gray-800`}>Product Tags</MyText>
      <TouchableOpacity
        onPress={handleAddNewTag}
        style={tw`bg-blue-500 px-4 py-2 rounded-lg flex-row items-center`}
      >
        <MaterialIcons name="add" size={20} color="white" />
        <MyText style={tw`text-white font-medium ml-2`}>Add New Tag</MyText>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
        <MyText style={tw`text-gray-500`}>Loading tags...</MyText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 bg-gray-50 justify-center items-center p-4`}>
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <MyText style={tw`text-red-500 text-lg font-semibold mt-4`}>Error</MyText>
        <MyText style={tw`text-gray-600 text-center mt-2`}>{error?.message || 'Failed to load tags'}</MyText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
        >
          <MyText style={tw`text-white font-medium`}>Retry</MyText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        data={tags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={renderHeader}
        contentContainerStyle={tw`pb-4`}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center py-12`}>
            <MaterialIcons name="label-off" size={64} color="#D1D5DB" />
            <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>No tags yet</MyText>
            <MyText style={tw`text-gray-400 text-center mt-2`}>Create your first product tag</MyText>
          </View>
        }
      />
    </View>
  );
}