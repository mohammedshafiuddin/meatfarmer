import React, { useState, useEffect } from 'react';
import TokenHistoryWebView from './TokenHistoryWebView';
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

  // from/to logic is only for web pagination
  const from = (page - 1) * itemsPerPage + 1;
  const to = data ? Math.min(page * itemsPerPage, data.totalCount || 0) : 0;

  if (isLoading && page === 1) {
    return <div>Loading token history...</div>;
  }

  if (isError) {
    return <div>Failed to load token history. Please try again later.</div>;
  }

  const tokens = data?.tokens || [];
  const totalCount = data?.totalCount || 0;

  return (
    <TokenHistoryWebView
      tokens={tokens}
      page={page - 1} // API is 1-based, component is 0-based
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={(p) => setPage(p + 1)} // Adjust for 1-based API
      numberOfItemsPerPageList={[5, 10, 20]}
      onItemsPerPageChange={handleItemsPerPageChange}
      from={from}
      to={to}
    />
  );
}

export default TokenHistory
