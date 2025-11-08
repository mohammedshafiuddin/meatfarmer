import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppContainer, MyText, tw, MyButton, useManualRefresh, MyTextInput, SearchBar } from 'common-ui';

import { trpc } from '@/src/trpc-client';
import { Product } from '@/src/api-hooks/product.api';

type FilterType = 'all' | 'in-stock' | 'out-of-stock';

export default function Products() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: productsData, isLoading, error, refetch } = trpc.admin.product.getProducts.useQuery();

  const toggleOutOfStockMutation = trpc.admin.product.toggleOutOfStock.useMutation();

  useManualRefresh(refetch);

  const products = productsData?.products || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = activeFilter === 'all' ||
        (activeFilter === 'in-stock' && !product.isOutOfStock) ||
        (activeFilter === 'out-of-stock' && product.isOutOfStock);

      return matchesSearch && matchesFilter;
    });
  }, [products, searchTerm, activeFilter]);

  const handleEdit = (productId: number) => {
    router.push(`/edit-product?id=${productId}` as any);
  };



  //   const handleToggleStock = (product: any) => {
  const handleToggleStock = (product: Pick<Product, 'id' | 'name' | 'isOutOfStock'>) => {
    const action = product.isOutOfStock ? 'mark as in stock' : 'mark as out of stock';
    Alert.alert(
      'Update Stock Status',
      `Are you sure you want to ${action} "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            toggleOutOfStockMutation.mutate({ id: product.id.toString() }, {
              onSuccess: (data) => {
                Alert.alert('Success', data.message);
                refetch(); // Refresh the list
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to update stock status');
              },
            });
          },
        },
      ]
    );
  };

  const handleViewDetails = (productId: number) => {
    router.push(`/product-detail/${productId}` as any);
  };

  const FilterButton = ({ filter, label, count }: { filter: FilterType; label: string; count: number }) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(filter)}
      style={tw`px-4 py-2 rounded-lg ${activeFilter === filter ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <MyText style={tw`${activeFilter === filter ? 'text-white' : 'text-gray-700'} font-semibold`}>
        {label} ({count})
      </MyText>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading products...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading products</MyText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-semibold`}>Retry</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  const inStockCount = products.filter(p => !p.isOutOfStock).length;
  const outOfStockCount = products.filter(p => p.isOutOfStock).length;

  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <MyText style={tw`text-2xl font-bold text-gray-800`}>Products</MyText>
          <MyButton onPress={() => router.push('/add-product' as any)}>
            Add Product
          </MyButton>
        </View>

        {/* Search Bar */}
        <View style={tw`mb-4`}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSearch={() => {}}
            placeholder="Search products..."
            containerStyle={tw`mb-0`}
          />
        </View>
        </View>

        {/* Filter Tabs */}
        <View style={tw`flex-row gap-2 mb-6`}>
          <FilterButton filter="all" label="All" count={products.length} />
          <FilterButton filter="in-stock" label="In Stock" count={inStockCount} />
          <FilterButton filter="out-of-stock" label="Out of Stock" count={outOfStockCount} />
        </View>

        {/* Products List */}
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredProducts.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center py-10`}>
              <MaterialIcons name="inventory" size={64} color="#D1D5DB" />
              <MyText style={tw`text-gray-500 text-center mt-4 text-lg`}>
                {searchTerm || activeFilter !== 'all' ? 'No products match your filters' : 'No products found'}
              </MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>
                {searchTerm || activeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Start by adding your first product'}
              </MyText>
              {(searchTerm || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
                >
                  <MyText style={tw`text-white font-semibold`}>Clear Filters</MyText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={tw`pb-4`}>
              {filteredProducts.map(product => (
                <View key={product.id} style={tw`bg-white rounded-2xl shadow-lg mb-4 overflow-hidden`}>
                  {/* Product Image */}
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={tw`w-full h-48`}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={tw`w-full h-48 bg-gray-200 justify-center items-center`}>
                      <MaterialIcons name="image" size={48} color="#9CA3AF" />
                    </View>
                  )}

                  {/* Product Info */}
                  <View style={tw`p-4`}>
                    <View style={tw`flex-row justify-between items-start mb-2`}>
                      <MyText style={tw`text-lg font-bold text-gray-800 flex-1 mr-2`} numberOfLines={2}>
                        {product.name}
                      </MyText>
                      <View style={tw`flex-row items-center`}>
                        <View style={tw`w-3 h-3 rounded-full mr-1 ${product.isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
                        <MyText style={tw`text-sm ${product.isOutOfStock ? 'text-red-500' : 'text-green-500'} font-semibold`}>
                          {product.isOutOfStock ? 'Out' : 'In'}
                        </MyText>
                      </View>
                    </View>

                    {product.shortDescription && (
                      <MyText style={tw`text-gray-600 mb-2`} numberOfLines={2}>
                        {product.shortDescription}
                      </MyText>
                    )}

                    <View style={tw`flex-row justify-between items-center mb-3`}>
                      <View>
                        <MyText style={tw`text-xl font-bold text-green-600`}>
                          ₹{product.price}
                        </MyText>
                        {product.marketPrice && (
                          <MyText style={tw`text-sm text-gray-500 line-through`}>
                            ₹{product.marketPrice}
                          </MyText>
                        )}
                      </View>
                    </View>

                     {/* Action Buttons */}
                     <View style={tw`flex-row gap-2`}>
                       <TouchableOpacity
                         onPress={() => handleViewDetails(product.id)}
                         style={tw`flex-1 bg-gray-500 p-3 rounded-lg flex-row items-center justify-center`}
                       >
                         <MaterialIcons name="visibility" size={16} color="white" />
                         <MyText style={tw`text-white font-semibold ml-1`}>View</MyText>
                       </TouchableOpacity>

                       <TouchableOpacity
                         onPress={() => handleEdit(product.id)}
                         style={tw`flex-1 bg-blue-500 p-3 rounded-lg flex-row items-center justify-center`}
                       >
                         <MaterialIcons name="edit" size={16} color="white" />
                         <MyText style={tw`text-white font-semibold ml-1`}>Edit</MyText>
                       </TouchableOpacity>

                       <TouchableOpacity
                         onPress={() => handleToggleStock(product)}
                         style={tw`flex-1 ${product.isOutOfStock ? 'bg-green-500' : 'bg-orange-500'} p-3 rounded-lg flex-row items-center justify-center`}
                       >
                         <MaterialIcons name={product.isOutOfStock ? "check-circle" : "block"} size={16} color="white" />
                         <MyText style={tw`text-white font-semibold ml-1`}>
                           {product.isOutOfStock ? 'Stock' : 'Out'}
                         </MyText>
                       </TouchableOpacity>
                     </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
    </AppContainer>
  );
}