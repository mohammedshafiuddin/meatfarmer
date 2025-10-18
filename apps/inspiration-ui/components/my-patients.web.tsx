import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { DataTable, tw } from 'common-ui';
import type { Column } from 'common-ui/src/components/data-table';
import dayjs from 'dayjs';
import { useGetHospitalPatientHistory } from '@/api-hooks/token.api';

interface Patient {
  id: number;
  name: string;
  mobile: string;
  age: number;
  gender: string;
  totalTokens: number;
  lastVisitDate: string;
  firstVisitDate: string;
  completedTokens: number;
  upcomingTokens: number;
}

interface Props {
  searchQuery?: string;
  filters?: any;
}

function MyPatients({ searchQuery = '', filters = {} }: Props) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const numberOfItemsPerPageList = [10, 20, 50];

  const { data, isLoading, isError, error } = useGetHospitalPatientHistory(
    page,
    itemsPerPage
  );

  // Effect to reset when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  if (isLoading && page === 1) {
    return <div>Loading patients...</div>;
  }

  if (isError) {
    return <div>Failed to load patients. Please try again later.</div>;
  }

  const patients = data?.patients || [];
  const totalCount = data?.totalCount || 0;
  const numberOfPages = Math.ceil(totalCount / itemsPerPage);
  const from = (page - 1) * itemsPerPage;
  const to = Math.min(page * itemsPerPage, totalCount);

  // Filter patients based on searchQuery
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mobile.includes(searchQuery)
  );

  const columns: Column<Patient>[] = [
    {
      header: 'Name',
      accessor: 'name',
      style: { flex: 2 },
      render: (row) => (
        <Link
          href={`/patient-details?id=${row.id}`}
          style={{
            color: 'blue',
            textDecorationLine: 'underline'
          }}
        >
          {row.name}
        </Link>
      )
    },
    { header: 'Mobile', accessor: 'mobile', style: { flex: 1.5 } },
    { header: 'Age', accessor: 'age', style: { flex: 0.8 } },
    { header: 'Gender', accessor: 'gender', style: { flex: 0.8 } },
    { header: 'Total Tokens', accessor: 'totalTokens', style: { flex: 1 } },
    {
      header: 'Last Visit',
      accessor: 'lastVisitDate',
      style: { flex: 1.2 },
      render: (row) => dayjs(row.lastVisitDate).isValid()
        ? dayjs(row.lastVisitDate).format('DD-MM-YY')
        : 'N/A'
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <DataTable
        columns={columns}
        data={filteredPatients}
        page={page - 1} // DataTable uses 0-based indexing
        numberOfPages={numberOfPages}
        onPageChange={(p) => setPage(p + 1)} // Convert back to 1-based
        from={from}
        to={to}
        totalCount={totalCount}
        numberOfItemsPerPageList={numberOfItemsPerPageList}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}

export default MyPatients;