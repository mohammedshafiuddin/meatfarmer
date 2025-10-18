import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import {
  MyText,
  tw,
  BottomDialog,
  SearchBar,
  MultiSelectDropdown,
  DatePicker,
  MyTextInput,
} from "common-ui";
import AppContainer from "@/components/app-container";
import { ThemedView } from "@/components/ThemedView";
import {
  useGetHospitalTokenHistory,
  TokenHistoryFilters,
} from "@/api-hooks/token.api";
import { useGetMyDoctors } from "@/api-hooks/my-doctors.api";
import { useSearchUserByMobile } from "@/api-hooks/user.api";
import { Ionicons } from "@expo/vector-icons";
import TokenHistoryWebView from "@/components/TokenHistoryWebView";
import TokenHistoryCard from "@/components/TokenHistoryCard";
import PaginationComponent from "@/components/Pagination";
import PaperPagination from "@/components/paper-pagination";
import TokenHistory from "@/components/tokenhistory";

export default function TokenHistoryScreen() {
  const [page, setPage] = useState(1); // Use 1-based indexing for API
  const [allTokens, setAllTokens] = useState<any[]>([]);
  const [numberOfItemsPerPageList] = useState([5, 10, 20]);
  const [itemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setFilterVisible] = useState(false);

  // Staged filter states (for the dialog)
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [patientMobile, setPatientMobile] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // Active filter state (for the API call)
  const [activeFilters, setActiveFilters] = useState<TokenHistoryFilters>({});

  const { data: doctors, isLoading: isLoadingDoctors } = useGetMyDoctors({
    enabled: isFilterVisible,
  });
  const { data: patients, isLoading: patientsLoading } =
    useSearchUserByMobile(patientMobile);

  const [paginationModel, setPaginationModel] = useState({currentPage: 1, pageSize: 10})
  const statusOptions = [
    { label: "Upcoming", value: "UPCOMING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Missed", value: "MISSED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const patientOptions = useMemo(() => {
    return (patients || []).map((p) => ({
      label: `${p.name} (${p.age})`,
      value: p.id.toString(),
    }));
  }, [patients]);

  const { data, isLoading, isError, error } = useGetHospitalTokenHistory(
    page,
    itemsPerPage,
    activeFilters
  );

  const doctorOptions = useMemo(() => {
    return (doctors || []).map((doc) => ({
      label: `Dr. ${doc.name}`,
      value: doc.id.toString(),
    }));
  }, [doctors]);

  const totalCount = data?.totalCount || 0;

  // Effect to accumulate tokens for infinite scroll
  React.useEffect(() => {
    if (data?.tokens) {
      if (page === 1) {
        setAllTokens(data.tokens); // Reset list for first page
      } else {
        // Append for subsequent pages, avoiding duplicates
        setAllTokens((prevTokens) => {
          const existingIds = new Set(prevTokens.map((t) => t.id));
          const uniqueNewTokens = data.tokens.filter(
            (t) => !existingIds.has(t.id)
          );
          return [...prevTokens, ...uniqueNewTokens];
        });
      }
    }
  }, [data]);

  // Effect to reset pagination when filters change
  React.useEffect(() => {
    setPage(1); // Reset to first page
    setAllTokens([]); // Clear existing tokens
  }, [activeFilters, itemsPerPage]);

  // from/to logic is only for web pagination
  const from = (page - 1) * itemsPerPage;
  const to = Math.min(page * itemsPerPage, totalCount);

  const handleLoadMore = () => {
    if (!isLoading && allTokens.length < totalCount) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  if (isLoading && page === 1) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color={tw.color("blue-500")} />
          <MyText style={tw`mt-4 text-lg`}>Loading token history...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (isError) {
    return (
      <AppContainer>
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
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ThemedView style={tw`flex-1`}>
        <View style={tw``}>
          <MyText
            style={tw`text-2xl font-bold text-gray-800 dark:text-white mb-4`}
          >
            Token History
          </MyText>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={tw`flex-1`}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={() => {
                  // TODO: Implement search functionality
                }}
                placeholder="Search by name, status..."
              />
            </View>
            <TouchableOpacity
              onPress={() => setFilterVisible(true)}
              style={tw`p-2 ml-2`}
            >
              <Ionicons name="filter" size={24} color={tw.color("gray-600")} />
            </TouchableOpacity>
          </View>
        </View>

        <BottomDialog
          open={isFilterVisible}
          onClose={() => setFilterVisible(false)}
        >
          <View style={tw``}>
            <MyText style={tw`text-lg font-bold mb-4`}>Filter Options</MyText>

            <MyText style={tw`text-base font-semibold mb-2`}>By Doctor</MyText>
            {isLoadingDoctors ? (
              <ActivityIndicator style={tw`my-4`} />
            ) : (
              <MultiSelectDropdown
                data={doctorOptions}
                value={selectedDoctorIds}
                onChange={setSelectedDoctorIds}
                placeholder="Select doctors"
              />
            )}

            <MyText style={tw`text-base font-semibold mt-4 mb-2`}>
              By Date
            </MyText>
            <View style={tw`flex-row justify-between`}>
              <View style={tw`w-[48%]`}>
                <DatePicker
                  value={startDate}
                  setValue={setStartDate}
                  placeholder="Start Date"
                />
              </View>
              <View style={tw`w-[48%]`}>
                <DatePicker
                  value={endDate}
                  setValue={setEndDate}
                  placeholder="End Date"
                />
              </View>
            </View>

            <MyText style={tw`text-base font-semibold mt-4 mb-2`}>
              By Status
            </MyText>
            <MultiSelectDropdown
              data={statusOptions}
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="Select statuses"
            />

            <MyText style={tw`text-base font-semibold mt-4 mb-2`}>
              By Patient
            </MyText>
            <MyTextInput
              placeholder="Enter 10-digit mobile to search"
              keyboardType="phone-pad"
              maxLength={10}
              value={patientMobile}
              onChangeText={setPatientMobile}
            />
            {patientsLoading && <ActivityIndicator style={tw`mt-2`} />}
            {patients && patientMobile.length >= 10 && (
              <View style={tw`mt-2`}>
                <MultiSelectDropdown
                  data={patientOptions}
                  value={selectedPatientIds}
                  onChange={setSelectedPatientIds}
                  placeholder="Select patients from results"
                />
              </View>
            )}

            <View
              style={tw`flex-row justify-end border-t border-gray-200 pt-4 mt-auto`}
            >
              <TouchableOpacity
                onPress={() => {
                  // Clear staged filters
                  setSelectedDoctorIds([]);
                  setStartDate(null);
                  setEndDate(null);
                  setSelectedStatuses([]);
                  setPatientMobile("");
                  setSelectedPatientIds([]);
                  // Also clear active filters
                  setActiveFilters({});
                }}
                style={tw`px-4 py-2 mr-2`}
              >
                <MyText style={tw`text-gray-600`}>Clear</MyText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // Apply staged filters to active filters
                  const newFilters: TokenHistoryFilters = {
                    doctorIds: selectedDoctorIds,
                    patientIds: selectedPatientIds,
                    statuses: selectedStatuses,
                    startDate: startDate
                      ? startDate.toISOString().split("T")[0]
                      : null,
                    endDate: endDate
                      ? endDate.toISOString().split("T")[0]
                      : null,
                  };
                  setActiveFilters(newFilters);
                  setFilterVisible(false);
                }}
                style={tw`bg-blue-600 px-4 py-2 rounded-lg`}
              >
                <MyText style={tw`text-white font-bold`}>Apply</MyText>
              </TouchableOpacity>
            </View>
          </View>
        </BottomDialog>
        <TokenHistory filters={activeFilters} itemsPerPage={itemsPerPage} />
        {/* <TokenHistory tokens={Platform.OS === "web" ? data?.tokens || [] : allTokens} /> */}
      </ThemedView>
    </AppContainer>
  );
}
