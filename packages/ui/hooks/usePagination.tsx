import { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { tw } from '../index';

export const usePagination = (initialPageSize: number = 10) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = initialPageSize;

  const PaginationComponent = ({ totalCount }: { totalCount: number }) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalCount === 0 || totalPages <= 1) {
      return null;
    }

    const getVisiblePages = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 3;
      const half = Math.floor(maxVisible / 2);

      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }

      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <View style={tw`w-full bg-white border-t border-gray-200 px-4 py-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(currentPage - 1)}
            style={tw`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-100' : 'bg-blue-500'}`}
          >
            <Text style={tw`${currentPage === 1 ? 'text-gray-400' : 'text-white'} text-sm font-medium`}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={tw`flex-row items-center`}>
            {visiblePages.map((page, index) => (
              <TouchableOpacity
                key={index}
                disabled={typeof page === 'string'}
                onPress={() => typeof page === 'number' && setCurrentPage(page)}
                style={tw`px-3 py-2 mx-1 rounded-lg ${
                  typeof page === 'number' && currentPage === page ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  style={tw`${
                    typeof page === 'number' && currentPage === page ? 'text-white font-semibold' : 'text-gray-600'
                  } text-sm`}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(currentPage + 1)}
            style={tw`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-100' : 'bg-blue-500'}`}
          >
            <Text style={tw`${currentPage === totalPages ? 'text-gray-400' : 'text-white'} text-sm font-medium`}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return { currentPage, pageSize, PaginationComponent };
};