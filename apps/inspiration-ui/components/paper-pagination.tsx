// PaperPagination.tsx
import React, { useMemo } from 'react';
import { DataTable } from 'react-native-paper';

type PaginationModel = {
  currentPage: number; // 1-based
  pageSize: number;
};

type Props = {
  totalRecords: number;
  paginationModel: PaginationModel;
  setPaginationModel: (m: PaginationModel) => void;
  pageSizeOptions?: number[];
  showFastPaginationControls?: boolean;
  selectPageDropdownLabel?: string;
};

export default function PaperPagination({
  totalRecords,
  paginationModel,
  setPaginationModel,
  pageSizeOptions = [10, 20, 50, 100, 150, 200, 250, 300],
  showFastPaginationControls = true,
  selectPageDropdownLabel = 'Rows per page',
}: Props) {
  const { currentPage, pageSize } = paginationModel;

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // DataTable uses zero-based page index
  const pageZeroBased = Math.max(0, Math.min(totalPages - 1, currentPage - 1));

  const from = Math.min(totalRecords, pageZeroBased * pageSize + 1);
  const to = Math.min(totalRecords, (pageZeroBased + 1) * pageSize);

  function onPageChange(newPageZeroBased: number) {
    setPaginationModel({ ...paginationModel, currentPage: newPageZeroBased + 1 });
  }

  function onItemsPerPageChange(newSize: number) {
    // common pattern: reset to first page when page size changes
    setPaginationModel({ currentPage: 1, pageSize: newSize });
  }

  return (
    <DataTable.Pagination
      page={pageZeroBased}
      numberOfPages={totalPages}
      onPageChange={onPageChange}
      label={`${from}-${to} of ${totalRecords}`}
      numberOfItemsPerPageList={pageSizeOptions}
      numberOfItemsPerPage={pageSize}
      onItemsPerPageChange={onItemsPerPageChange}
      showFastPaginationControls={showFastPaginationControls}
      selectPageDropdownLabel={selectPageDropdownLabel}
    />
  );
}
