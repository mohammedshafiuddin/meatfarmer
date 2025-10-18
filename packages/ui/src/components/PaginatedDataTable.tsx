import React from 'react';
import { DataTable } from 'react-native-paper';
import dayjs from 'dayjs';

// Define the shape of a single token item
interface Token {
  id: number;
  queueNum: number;
  tokenDate: string;
  doctorName: string;
  patientName: string;
  status: string;
}

// Define the props for the component
interface PaginatedDataTableProps {
  tokens: Token[];
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

const PaginatedDataTable: React.FC<PaginatedDataTableProps> = ({
  tokens,
  page,
  numberOfPages,
  onPageChange,
  from,
  to,
  totalCount,
  numberOfItemsPerPageList,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title style={{ flex: 0.6 }}>Q.No</DataTable.Title>
        <DataTable.Title style={{ flex: 1 }}>Date</DataTable.Title>
        <DataTable.Title style={{ flex: 1.5 }}>Doctor</DataTable.Title>
        <DataTable.Title style={{ flex: 1.5 }}>Patient</DataTable.Title>
        <DataTable.Title style={{ flex: 1 }}>Status</DataTable.Title>
      </DataTable.Header>

      {tokens.map((token) => (
        <DataTable.Row key={token.id}>
          <DataTable.Cell style={{ flex: 0.6 }}>{token.queueNum}</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1 }}>{dayjs(token.tokenDate).format('DD-MM-YY')}</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1.5 }}>{token.doctorName}</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1.5 }}>{token.patientName}</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1 }}>{token.status}</DataTable.Cell>
        </DataTable.Row>
      ))}

      <DataTable.Pagination
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
    </DataTable>
  );
};

export default PaginatedDataTable;