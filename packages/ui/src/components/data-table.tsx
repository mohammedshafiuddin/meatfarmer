import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { DataTable as PaperDataTable } from 'react-native-paper';

// Define a generic column configuration
export interface Column<T> {
  header: string;
  accessor: keyof T;
  style?: StyleProp<ViewStyle>;
  render?: (row: T) => React.ReactNode;
}

// Define the props for the component, using a generic type T
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  page: number;
  numberOfPages: number;
  onPageChange: (page: number) => void;
  from: number;
  to: number;
  totalCount: number;
  numberOfItemsPerPageList: number[];
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const DataTable = <T extends { id: any }>({ // The data objects must have a unique 'id' property
  data,
  columns,
  page,
  numberOfPages,
  onPageChange,
  from,
  to,
  totalCount,
  numberOfItemsPerPageList,
  itemsPerPage,
  onItemsPerPageChange,
}: DataTableProps<T>) => {
  return (
    <PaperDataTable>
      <PaperDataTable.Header>
        {columns.map((col, index) => (
          <PaperDataTable.Title key={index} style={col.style}>
            {col.header}
          </PaperDataTable.Title>
        ))}
      </PaperDataTable.Header>

      {data.map((row) => (
        <PaperDataTable.Row key={row.id}>
          {columns.map((col, index) => (
            <PaperDataTable.Cell key={index} style={col.style}>
              {col.render ? col.render(row) : String(row[col.accessor] ?? '')}
            </PaperDataTable.Cell>
          ))}
        </PaperDataTable.Row>
      ))}

      <PaperDataTable.Pagination
        page={page}
        numberOfPages={numberOfPages}
        onPageChange={onPageChange}
        label={`${from + 1}-${to} of ${totalCount}`}
        numberOfItemsPerPageList={numberOfItemsPerPageList}
        numberOfItemsPerPage={itemsPerPage}
        onItemsPerPageChange={onItemsPerPageChange}
        showFastPaginationControls
        selectPageDropdownLabel={'Rows per page'}
      />
    </PaperDataTable>
  );
};

export default DataTable;