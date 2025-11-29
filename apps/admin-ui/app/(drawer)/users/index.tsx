import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer, MyText, tw, MyFlatList, MyTextInput } from 'common-ui';
import { trpc } from '@/src/trpc-client';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Users() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = trpc.admin.staffUser.getUsers.useInfiniteQuery(
    { search },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const users = data?.pages.flatMap(page => page.users) || [];

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={tw`flex-row items-center p-4 bg-white border-b border-gray-100`}
      onPress={() => router.push(`/user-details/${item.id}`)}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={tw`w-12 h-12 rounded-full mr-4`}
        />
      ) : (
        <View style={tw`w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-4`}>
          <Ionicons name="person" size={24} color="#6b7280" />
        </View>
      )}
      <View style={tw`flex-1`}>
        <MyText style={tw`font-bold text-gray-800 text-lg`}>{item.name}</MyText>
        <MyText style={tw`text-gray-600`}>{item.email}</MyText>
        <MyText style={tw`text-gray-500 text-sm`}>{item.mobile}</MyText>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        <View style={tw`bg-white px-4 py-2 border-b border-gray-100`}>
          <MyTextInput
            topLabel="Search Users"
            placeholder="Search by name, email, or mobile"
            value={search}
            onChangeText={setSearch}
            style={{ marginBottom: 0 }}
          />
        </View>

        <MyFlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={refetch}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center py-8`}>
              <MyText style={tw`text-gray-500`}>No users found</MyText>
            </View>
          }
        />
      </View>
    </AppContainer>
  );
}