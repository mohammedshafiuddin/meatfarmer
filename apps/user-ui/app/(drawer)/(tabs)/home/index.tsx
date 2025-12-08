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
} from "react-native";
import { useRouter } from "expo-router";
import {
  theme,
  tw,
  useManualRefresh,
  MyFlatList,
  useMarkDataFetchers,
  LoadingDialog,
} from "common-ui";
import dayjs from "dayjs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import SearchBar from "common-ui/src/components/search-bar";
import { trpc } from "@/src/trpc-client";

const { width: screenWidth } = Dimensions.get("window");
const itemWidth = (screenWidth - 48) / 2; // 48 = padding horizontal (16*2) + gap (16)

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
            onPress={() => handleAddToCart(item.id)}
          >
            <MaterialIcons name="add-shopping-cart" size={20} color={theme.colors.pink1} />
          </TouchableOpacity>
        )}
      </View>

      <View style={tw`p-3`}>
        <Text style={tw`text-gray-900 font-bold text-sm mb-1`} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={tw`flex-row items-baseline mb-2`}>
          <Text style={tw`text-pink1 font-bold text-base`}>₹{item.price}</Text>
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
            style={tw`bg-pink1 py-2 rounded-lg items-center mt-1`}
            onPress={() => handleBuyNow(item.id)}
          >
            <Text style={tw`text-white text-xs font-bold uppercase tracking-wide`}>Buy Now</Text>
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

  const products = productsData?.products || [];
  const dashboardTags = tagsData?.tags || [];
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
    <View style={tw`flex-1 bg-gray-50`}>

      <MyFlatList
        data={products}
        numColumns={2}
        renderItem={({ item }) =>
          renderProduct({ item, router, handleAddToCart, handleBuyNow })
        }
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={[tw`px-4 pb-24`, { gap: 16 }]}
        ListHeaderComponent={
          <View style={tw`pt-4 pb-2`}>


            {/* Search Bar */}
            <SearchBar
              value={inputQuery}
              onChangeText={setInputQuery}
              onSearch={() => {
                setSearchQuery(inputQuery);
                setSelectedTagId(null);
              }}
              placeholder="Search fresh meat..."
              containerStyle={tw`mb-6 shadow-sm border-0 bg-white rounded-xl`}
            />

            {/* Categories / Tags */}
            {dashboardTags.length > 0 && (
              <View style={tw`mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <Text style={tw`text-lg font-bold text-gray-900`}>Categories</Text>
                </View>
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
                        ? "bg-pink1 border-pink1"
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
              </View>
            )}

            {/* Section Title */}
            <View style={tw`flex-row justify-between items-center mb-2`}>
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
          </View>
        }
      />

      <LoadingDialog open={isLoadingDialogOpen} message="Adding to cart..." />
    </View>
  );
}
