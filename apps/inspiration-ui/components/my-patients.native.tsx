import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { MyText, tw } from 'common-ui';
import { Ionicons } from '@expo/vector-icons';
import PatientCard from './PatientCard';
import PaperPagination from './paper-pagination';
import { useGetHospitalPatientHistory } from '@/api-hooks/token.api';

interface Props {
  searchQuery?: string;
  filters?: any;
}

function MyPatients({ searchQuery = '', filters = {} }: Props) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading, isError, error } = useGetHospitalPatientHistory(
    page,
    itemsPerPage
  );

  // Effect to reset when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  if (isLoading && page === 1) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <ActivityIndicator size="large" color={tw.color("blue-500")} />
        <MyText style={tw`mt-4 text-lg`}>Loading patients...</MyText>
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
          Failed to load patients. Please try again later.
        </MyText>
      </View>
    );
  }

  const patients = data?.patients || [];
  const totalCount = data?.totalCount || 0;

  // Filter patients based on searchQuery
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mobile.includes(searchQuery)
  );

  return (
    <>
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PatientCard patient={item} />}
        contentContainerStyle={tw`p-4`}
        ListEmptyComponent={() => (
          <View style={tw`flex-1 justify-center items-center mt-20`}>
            <Ionicons
              name="people-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <MyText style={tw`text-lg text-gray-500 mt-4`}>
              No patients found.
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

export default MyPatients;