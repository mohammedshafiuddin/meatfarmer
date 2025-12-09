import React from 'react';
import { View, TouchableOpacity, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { MyText, tw, MyButton, useMarkDataFetchers } from 'common-ui';
import MyFlatList from 'common-ui/src/components/flat-list';
import { trpc } from '@/src/trpc-client';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export default function Stores() {
  const router = useRouter();

  const { data: storesData, isLoading, error, refetch } = trpc.admin.store.getStores.useQuery();

  useMarkDataFetchers(() => {
    refetch();
  });

  const stores = storesData?.stores || [];

  const handleEdit = (storeId: number) => {
    router.push({ pathname: '/edit-store', params: { id: storeId } });
  };

  const CARD_MARGIN = 8;
  const cardWidth = (screenWidth - 32 - CARD_MARGIN * 2) / 2;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(500)}
      style={{ width: cardWidth, margin: CARD_MARGIN }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleEdit(item.id)}
        style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1`}
      >
        {/* Image Section - Portrait oriented */}
        <View style={tw`h-40 w-full bg-gray-50 relative`}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
          ) : (
            <View style={tw`w-full h-full items-center justify-center`}>
              <MaterialIcons name="storefront" size={32} color="#E5E7EB" />
            </View>
          )}

          {/* Status Dot */}
          <View style={tw`absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white`} />
        </View>

        {/* Content Section */}
        <View style={tw`p-3`}>
          <MyText
            style={tw`text-base font-bold text-gray-900 leading-5 mb-1`}
            numberOfLines={1}
          >
            {item.name}
          </MyText>

          <View style={tw`flex-row items-center mb-2`}>
            <MyText style={tw`text-gray-400 text-xs font-medium`}>ID: #{item.id}</MyText>
            <View style={tw`w-1 h-1 rounded-full bg-gray-300 mx-1.5`} />
            <MyText style={tw`text-gray-400 text-xs font-medium`}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
            </MyText>
          </View>

          {/* Action Footer */}
          <View style={tw`flex-row items-center justify-between pt-2 border-t border-gray-50`}>
            <MyText style={tw`text-blue-600 text-[10px] font-bold uppercase tracking-wide`}>View Details</MyText>
            <Feather name="arrow-right" size={12} color="#2563EB" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#2563EB" />
        <MyText style={tw`text-gray-500 mt-4 font-medium`}>Loading stores...</MyText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-6`}>
        <View style={tw`bg-red-50 p-6 rounded-full mb-4`}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        </View>
        <MyText style={tw`text-xl font-bold text-gray-900 mb-2`}>Oops!</MyText>
        <MyText style={tw`text-gray-600 text-center mb-6`}>We couldn't load the stores. Please try again.</MyText>
        <MyButton onPress={() => refetch()} style={tw`bg-red-500 px-8 py-3 rounded-xl`}>
          Retry
        </MyButton>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <MyFlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={tw`justify-start`}
        contentContainerStyle={tw`p-2 pb-24`}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(600)} style={tw`mb-8 mt-4 px-1`}>
            <View style={tw`flex-row justify-between items-end mb-2`}>
              <View>
                <MyText style={tw`text-3xl font-bold text-gray-800 tracking-tight`}>Stores</MyText>
                <MyText style={tw`text-gray-500 text-base font-medium mt-1`}>Manage your outlets</MyText>
              </View>
              <View style={tw`bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-sm`}>
                <MyText style={tw`text-gray-600 font-semibold text-xs`}>{stores.length} Locations</MyText>
              </View>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center mt-20`}>
            <MaterialIcons name="store-mall-directory" size={80} color="#E5E7EB" />
            <MyText style={tw`text-gray-400 text-lg font-medium mt-4`}>No stores found</MyText>
            <MyText style={tw`text-gray-400 text-sm text-center max-w-[250px] mt-2`}>Get started by adding your first store location.</MyText>
          </View>
        }
      />

      {/* Floating Action Button for Adding New Store */}
      <Animated.View entering={FadeInUp.delay(500)} style={tw`absolute bottom-8 right-6 shadow-xl`}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/add-store' as any)}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`w-16 h-16 rounded-full items-center justify-center`}
          >
            <MaterialIcons name="add" size={32} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}