import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { MyText, tw } from 'common-ui';
import { Ionicons } from '@expo/vector-icons';
import TokenHistoryCard from './TokenHistoryCard';
import PaperPagination from './paper-pagination';
import { useGetHospitalTokenHistory, TokenHistoryFilters } from '@/api-hooks/token.api';

interface Props {
  itemsPerPage?: number;
  filters?: TokenHistoryFilters;
}

function TokenHistory({ itemsPerPage: initialItemsPerPage = 10, filters = {} }: Props) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const { data, isLoading, isError, error } = useGetHospitalTokenHistory(
    page,
    itemsPerPage,
    filters
  );

  // Effect to reset when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setPage(1); // Reset to first page when page size changes
  };

  if (isLoading && page === 1) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <ActivityIndicator size="large" color={tw.color("blue-500")} />
        <MyText style={tw`mt-4 text-lg`}>Loading token history...</MyText>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={tw.color("red-500")}
        />
        <MyText style={tw`text-red-500 text-center mt-4 text-lg`}>
          Failed to load token history. Please try again later.
        </MyText>
      </View>
    );
  }

  const tokens = data?.tokens || [];
  const totalCount = data?.totalCount || 0;

  return (
    <>
      <FlatList
        data={tokens}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TokenHistoryCard token={item} />}
        contentContainerStyle={tw`p-4`}
        ListEmptyComponent={() => (
          <View style={tw`flex-1 justify-center items-center mt-20`}>
            <Ionicons
              name="file-tray-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <MyText style={tw`text-lg text-gray-500 mt-4`}>
              No tokens found.
            </MyText>
          </View>
        )}
        ListFooterComponent={() => (
          totalCount > 0 ? (
            <View style={tw`p-4 border-t border-gray-200`}>
              <PaperPagination
                totalRecords={totalCount}
                paginationModel={{ currentPage: page, pageSize: itemsPerPage }}
                setPaginationModel={(model) => {
                  setPage(model.currentPage);
                }}
                pageSizeOptions={[5, 10, 20]}
                // onItemsPerPageChange={handleItemsPerPageChange}
              />
            </View>
          ) : null
        )}
      />
    </>
  );
}

export default TokenHistory
