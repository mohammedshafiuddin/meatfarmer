import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { MyText, tw } from 'common-ui';
import AppContainer from '@/components/app-container';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams } from 'expo-router';
import { useGetPatientDetails } from '@/api-hooks/user.api';
import PaginationComponent from '@/components/Pagination';

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: patient, isLoading, error } = useGetPatientDetails(id as string);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  if (isLoading) {
    return (
      <AppContainer>
        <ThemedView style={tw`flex-1 justify-center items-center`}>
          <MyText>Loading...</MyText>
        </ThemedView>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <ThemedView style={tw`flex-1 justify-center items-center`}>
          <MyText>Error loading patient details</MyText>
        </ThemedView>
      </AppContainer>
    );
  }

  if (!patient) {
    return (
      <AppContainer>
        <ThemedView style={tw`flex-1 justify-center items-center`}>
          <MyText>Patient not found</MyText>
        </ThemedView>
      </AppContainer>
    );
  }

  const totalConsultations = patient.consultationHistory.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = patient.consultationHistory.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AppContainer>
      <ThemedView style={tw`flex-1 p-4`}>
        <MyText style={tw`text-2xl font-bold text-gray-800 dark:text-white mb-4`}>
          Patient Details
        </MyText>
        <ScrollView style={tw`flex-1`}>
          <View style={tw`bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4`}>
            <MyText style={tw`text-lg mb-2`}>Name: {patient.name}</MyText>
            <MyText style={tw`text-lg mb-2`}>Age: {patient.age || 'N/A'}</MyText>
            <MyText style={tw`text-lg mb-2`}>Gender: {patient.gender || 'N/A'}</MyText>
            <MyText style={tw`text-lg mb-2`}>Last Consultation: {patient.last_consultation || 'N/A'}</MyText>
          </View>

          <MyText style={tw`text-xl font-bold text-gray-800 dark:text-white mb-2`}>
            Consultation History
          </MyText>
          {paginatedHistory.map((consultation, index) => (
            <View key={startIndex + index} style={tw`bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2`}>
              <MyText style={tw`text-base mb-1`}>Date: {consultation.date}</MyText>
              <MyText style={tw`text-base mb-1`}>Doctor: {consultation.doctorDetails.name}</MyText>
              <MyText style={tw`text-base`}>Notes: {consultation.notes}</MyText>
            </View>
          ))}
        </ScrollView>
        {totalConsultations > itemsPerPage && (
          <View style={tw`p-4 border-t border-gray-200`}>
            <PaginationComponent
              totalRecords={totalConsultations}
              paginationModel={{ currentPage, pageSize: itemsPerPage }}
              setPaginationModel={(model) => setCurrentPage(model.currentPage)}
            />
          </View>
        )}
      </ThemedView>
    </AppContainer>
  );
}