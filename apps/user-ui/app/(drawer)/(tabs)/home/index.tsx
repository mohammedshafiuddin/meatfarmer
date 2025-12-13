import React, { useState } from "react";
import {
  View,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  theme,
  tw,
  useManualRefresh,
  useMarkDataFetchers,
  LoadingDialog,
  AppContainer,
} from "common-ui";
import dayjs from "dayjs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Ionicons } from "@expo/vector-icons";

import { trpc } from "@/src/trpc-client";
import FloatingCartBar from "@/components/FloatingCartBar";

const { width: screenWidth } = Dimensions.get("window");
const itemWidth = screenWidth * 0.45; // 45% of screen width

const renderProduct = ({
  item,
  router,
  handleAddToCart,
  handleBuyNow,
}: {
  item: any;
  router: any;
  handleAddToCart: any;
  handleBuyNow: any;
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`bg-white rounded-2xl shadow-sm mb-2 overflow-hidden border border-gray-100`,
        { width: itemWidth },
      ]}
      onPress={() => router.push(`/(drawer)/(tabs)/home/product-detail/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={tw`relative`}>
        <Image
          source={{ uri: item.images?.[0] }}
          style={{ width: "100%", height: itemWidth, resizeMode: "cover" }}
        />
        {item.isOutOfStock && (
          <View style={tw`absolute inset-0 bg-black/40 items-center justify-center`}>
            <View style={tw`bg-red-500 px-3 py-1 rounded-full`}>
              <Text style={tw`text-white text-xs font-bold`}>Out of Stock</Text>
            </View>
          </View>
        )}
        {!item.isOutOfStock && (
          <TouchableOpacity
            style={tw`absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md`}
            onPress={() => handleBuyNow(item.id)}
          >
            <Ionicons name="flash" size={16} color={theme.colors.brand500} />
          </TouchableOpacity>
        )}
      </View>

      <View style={tw`p-3`}>
        <Text style={tw`text-gray-900 font-bold text-sm mb-1`} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={tw`flex-row items-baseline mb-2`}>
          <Text style={tw`text-brand500 font-bold text-base`}>₹{item.price}</Text>
          <Text style={tw`text-gray-400 text-xs ml-1`}>/ {item.unit || "unit"}</Text>
        </View>

        {item.nextDeliveryDate && (
          <View style={tw`flex-row items-center bg-blue-50 px-2 py-1.5 rounded-lg self-start mb-2 border border-blue-100`}>
            <MaterialIcons name="local-shipping" size={12} color="#3B82F6" />
            <Text style={tw`text-[10px] text-blue-700 ml-1.5 font-bold`}>
              {dayjs(item.nextDeliveryDate).format("ddd, DD MMM • h:mm A")}
            </Text>
          </View>
        )}

        {!item.isOutOfStock ? (
          <TouchableOpacity
            style={tw`bg-brand500 py-2 rounded-lg items-center mt-1`}
            onPress={() => handleAddToCart(item.id)}
          >
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="add-shopping-cart" size={16} color="white" style={tw`mr-1`} />
              <Text style={tw`text-white text-xs font-bold uppercase tracking-wide`}>Add to Cart</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={tw`bg-gray-100 py-2 rounded-lg items-center mt-1`}>
            <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-wide`}>Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const renderStore = ({
  item,
  router,
}: {
  item: any;
  router: any;
}) => {
  return (
    <TouchableOpacity
      style={tw`items-center mr-5`}
      onPress={() => router.push(`/(drawer)/(tabs)/stores?storeId=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={tw`w-14 h-14 rounded-full bg-white/10 border border-white/20 items-center justify-center mb-2 shadow-sm overflow-hidden`}>
        {item.signedImageUrl ? (
          <Image
            source={{ uri: item.signedImageUrl }}
            style={tw`w-14 h-14 rounded-full`}
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons name="storefront" size={24} color="#FFF" />
        )}
      </View>

      <Text style={tw`text-white font-medium text-xs text-center tracking-wide`} numberOfLines={2}>
        {item.name.replace(/^The\s+/i, '')}
      </Text>
    </TouchableOpacity>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [inputQuery, setInputQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = trpc.common.product.getAllProductsSummary.useQuery({
    searchQuery: searchQuery || undefined,
    tagId: selectedTagId || undefined,
  });

  const { data: tagsData } = trpc.common.product.getDashboardTags.useQuery();
  const { data: cartData, refetch: refetchCart } = trpc.user.cart.getCart.useQuery();
  const { data: storesData } = trpc.user.stores.getStores.useQuery();
  const { data: defaultAddressResponse } = trpc.user.address.getDefaultAddress.useQuery();

  const products = productsData?.products || [];
  const dashboardTags = tagsData?.tags || [];
  const defaultAddress = defaultAddressResponse?.data;
  const addToCart = trpc.user.cart.addToCart.useMutation();

  const handleTagSelect = (tagId: number) => {
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    } else {
      setSelectedTagId(tagId);
    }
    setSearchQuery('');
  };

  useManualRefresh(() => {
    refetch();
  });

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleAddToCart = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          Alert.alert("Success", "Item added to cart!");
          refetchCart();
        },
        onError: (error: any) => {
          Alert.alert("Error", error.message || "Failed to add item to cart");
        },
        onSettled: () => {
          setIsLoadingDialogOpen(false);
        },
      }
    );
  };

  const handleBuyNow = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          router.push(`/(drawer)/(tabs)/cart?select=${productId}`);
        },
        onError: (error: any) => {
          Alert.alert("Error", error.message || "Failed to add item to cart");
        },
        onSettled: () => {
          setIsLoadingDialogOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Failed to load products</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white `}>
      <ScrollView style={tw`flex-1`}>
        <LinearGradient
          colors={['#194185', '#1570EF']} // brand900 to brand600
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`pb-8 pt-6 px-5 rounded-b-[32px] shadow-lg mb-4`}
        >
          <View style={tw`flex-row justify-between items-start mb-6`}>
            <View style={tw`flex-1 mr-4`}>
              <View style={tw`flex-row items-center mb-1`}>
                <View style={tw`bg-white/20 p-1 rounded-full mr-2`}>
                  <MaterialIcons name="location-pin" size={14} color="#FFF" />
                </View>
                <Text style={tw`text-brand100 text-xs font-bold uppercase tracking-widest`}>
                  Delivery to {defaultAddress?.name ? defaultAddress.name.split(' ')[0] : 'Home'}
                </Text>
              </View>
              <Text style={tw`text-white text-sm font-medium opacity-90 ml-1`} numberOfLines={1}>
                {defaultAddress ? `${defaultAddress.addressLine1}, ${defaultAddress.city}` : 'Add your delivery address'}
              </Text>

            </View>

            <TouchableOpacity
              onPress={() => router.push('/(drawer)/(tabs)/me')}
              style={tw`bg-white/10 p-2 rounded-xl border border-white/10`}
            >
              <MaterialIcons name="person" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={tw`flex-row items-center bg-white rounded-2xl px-4 h-12 mb-8 shadow-md`}>
            <MaterialIcons name="search" size={24} color={theme.colors.brand500} />
            <TextInput
              style={tw`flex-1 ml-3 text-base text-gray-800`}
              placeholder="Search fresh meat..."
              placeholderTextColor="#9CA3AF"
              value={inputQuery}
              onChangeText={setInputQuery}
              onSubmitEditing={() => {
                if (inputQuery.trim()) {
                  router.push(`/(drawer)/(tabs)/home/search-results?q=${encodeURIComponent(inputQuery.trim())}`);
                }
              }}
              returnKeyType="search"
            />
          </View>

          {/* Categories / Tags - COMMENTED OUT FOR UI SIMPLIFICATION */}
          {/* DO NOT REMOVE: This section is preserved for future use if categories are needed again */}
          {/*
          {dashboardTags.length > 0 && (
            <View style={tw`mb-6`}>
              <View style={tw`flex-row justify-between items-center mb-3 pr-4`}>
                <Text style={tw`text-lg font-bold text-gray-900`}>Categories</Text>
              </View>
              <View style={tw`relative`}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`pr-4`}
                >
                  {dashboardTags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => handleTagSelect(tag.id)}
                      style={tw`flex-row items-center px-4 py-2.5 mr-3 rounded-xl border ${selectedTagId === tag.id
                        ? "bg-brand500 border-brand500"
                        : "bg-white border-gray-200"
                        } shadow-sm`}
                    >
                      {tag.imageUrl && (
                        <Image
                          source={{ uri: tag.imageUrl }}
                          style={tw`w-5 h-5 rounded mr-2`}
                          resizeMode="cover"
                        />
                      )}
                      <Text
                        style={tw`text-sm font-bold ${selectedTagId === tag.id
                          ? "text-white"
                          : "text-gray-700"
                          }`}
                      >
                        {tag.tagName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.08)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`absolute right-0 top-0 bottom-0 w-8 rounded-l-xl`}
                  pointerEvents="none"
                />
              </View>
            </View>
          )}
          */}

          {/* Stores Section */}
          {storesData?.stores && storesData.stores.length > 0 && (
            <View style={tw``}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <Text style={tw`text-lg font-bold text-white tracking-tight`}>Top Stores</Text>
              </View>
              <View style={tw`pb-2`}>
                <View style={tw`flex-row flex-wrap justify-start`}>
                  {storesData.stores.map((store, index) => (
                    <View key={store.id} style={tw``}>
                      {renderStore({ item: store, router })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* White Section */}
        <View style={tw`bg-white`}>
          {/* Section Title */}
          <View style={tw`flex-row items-center mb-2 px-4 pt-4`}>
            {searchQuery ? (
              <Text style={tw`text-lg font-bold text-gray-900`}>Results for "{searchQuery}"</Text>
            ) : selectedTagId ? (
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {dashboardTags.find(t => t.id === selectedTagId)?.tagName}
              </Text>
            ) : (
              <Text style={tw`text-lg font-bold text-gray-900`}>Popular Items</Text>
            )}
          </View>

          <View style={tw`relative`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`px-4 pb-4`}
            >
              {products.map((item, index) => (
                <View key={index} style={tw`mr-4`}>
                  {renderProduct({ item, router, handleAddToCart, handleBuyNow })}
                </View>
              ))}
            </ScrollView>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.08)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={tw`absolute right-0 top-0 bottom-4 w-12 rounded-l-xl`}
              pointerEvents="none"
            />
          </View>
        </View>

        <LoadingDialog open={isLoadingDialogOpen} message="Adding to cart..." />
        <View style={tw`h-16`}></View>
      </ScrollView>

      <FloatingCartBar />
    </View>
  );
}
