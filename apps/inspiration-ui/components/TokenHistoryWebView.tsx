import React from 'react';
import { ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { DataTable, tw } from 'common-ui';
import type { Column } from 'common-ui/src/components/data-table';
import dayjs from 'dayjs';

// This component assumes it receives fully resolved data and callbacks
// The specific type for a token can be imported if available from shared-types
interface Token {
  id: any;
  [key: string]: any;
}

interface TokenHistoryWebViewProps {
  tokens: Token[];
  page: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  numberOfItemsPerPageList: number[];
  onItemsPerPageChange: (itemsPerPage: number) => void;
  from: number;
  to: number;
}

const TokenHistoryWebView: React.FC<TokenHistoryWebViewProps> = ({
  tokens,
  page,
  totalCount,
  itemsPerPage,
  onPageChange,
  numberOfItemsPerPageList,
  onItemsPerPageChange,
  from,
  to,
}) => {
  const columns: Column<Token>[] = [
    { header: 'Q.No', accessor: 'queueNum', style: { flex: 0.6 } },
    {
      header: 'Date',
      accessor: 'tokenDate',
      style: { flex: 1 },
      render: (row) => dayjs(row.tokenDate).format('DD-MM-YY'),
    },
    { header: 'Doctor', accessor: 'doctorName', style: { flex: 1.5 } },
    { header: 'Patient', accessor: 'patientName', style: { flex: 1.5 } },
    { header: 'Status', accessor: 'status', style: { flex: 1 } },
  ];

  return (
    <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
      <ThemedView style={tw`p-5 rounded-2xl shadow-md mb-6 border border-gray-200`}>
        <DataTable
          columns={columns}
          data={tokens}
          page={page}
          numberOfPages={Math.ceil(totalCount / itemsPerPage)}
          onPageChange={onPageChange}
          from={from}
          to={to}
          totalCount={totalCount}
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </ThemedView>
    </ScrollView>
  );
};

export default TokenHistoryWebView;