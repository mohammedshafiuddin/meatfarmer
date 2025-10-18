import { AppContainer , MyText , tw } from "common-ui";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  useHospitalTodaysTokens,
  useDoctorTodaysTokens,
} from "@/api-hooks/token.api";
import { getJWT } from "@/hooks/useJWT";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import { DoctorTokenSummary, DoctorTodayToken } from "common-ui/shared-types";
import { Ionicons } from "@expo/vector-icons";
import { ErrorToast } from "@/services/toaster";
import DoctorTokenCard from "./DoctorTokenCard";
import { LinearGradient } from "expo-linear-gradient";
import TabNavigation from "@/components/TabNavigation";

interface Props {}

function Index(props: Props) {
  const {} = props;
  const jwt = getJWT();
  const router = useRouter();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Define tab configuration
  const TABS = {
    UPCOMING: "UPCOMING",
    COMPLETED: "COMPLETED",
    NO_SHOW: "NO_SHOW",
  } as const;

  type TabType = keyof typeof TABS;

  const [activeTab, setActiveTab] = useState<TabType>("UPCOMING");

  // Using the hospital today API to fetch top tokens of doctors
  const {
    data: hospitalTokensData,
    isLoading: isLoadingHospital,
    error: hospitalError,
    isError: isHospitalError,
    refetch: refetchHospital,
  } = useHospitalTodaysTokens();

  // Fetch selected doctor's tokens if a doctor is selected
  const {
    data: doctorTokensData,
    isLoading: isLoadingDoctor,
    error: doctorError,
    isError: isDoctorError,
    refetch: refetchDoctor,
  } = useDoctorTodaysTokens(selectedDoctorId || 0);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchHospital();
      if (selectedDoctorId) {
        await refetchDoctor();
      }
    } catch (err) {
      ErrorToast("Failed to refresh tokens");
    } finally {
      setRefreshing(false);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleBackToSummary = () => {
    setSelectedDoctorId(null);
  };

  const handleSelectDoctor = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
  };

  // Filter tokens based on the active tab
  const filterTokensByStatus = (tokens: DoctorTodayToken[] | undefined) => {
    if (!tokens) return [];

    return tokens.filter((token) => {
      if (activeTab === TABS.UPCOMING) {
        return token.status === "UPCOMING" || token.status === "IN_PROGRESS";
      } else if (activeTab === TABS.COMPLETED) {
        return token.status === "COMPLETED";
      } else {
        // NO_SHOW
        return token.status === "MISSED";
      }
    });
  };

  return (
    <AppContainer>
      <ScrollView
        style={tw`flex-1 bg-gray-50`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4361ee"
          />
        }
      >
        <View style={tw`p-5`}>
          {/* Header with back button if doctor is selected */}
          {selectedDoctorId ? (
            <View style={tw`mb-6`}>
              <TouchableOpacity
                style={tw`flex-row items-center w-32`}
                onPress={handleBackToSummary}
              >
                <Ionicons name="arrow-back" size={24} color="#4361ee" />
                <MyText style={tw`ml-2 text-blue-600 font-bold`}>
                  All Doctors
                </MyText>
              </TouchableOpacity>
              <LinearGradient
                colors={["#4361ee", "#3a0ca3"]}
                style={tw`p-5 rounded-2xl shadow-lg mt-4`}
              >
                <MyText style={tw`text-white text-2xl font-bold`}>
                  {doctorTokensData?.doctorName}'s Tokens
                </MyText>
                <MyText style={tw`text-blue-100`}>
                  {doctorTokensData?.date
                    ? formatDate(doctorTokensData.date)
                    : "Today"}
                </MyText>
              </LinearGradient>

              {/* Tab navigation for doctor's tokens */}
              <TabNavigation
                tabs={[
                  { key: TABS.UPCOMING, title: "Upcoming" },
                  { key: TABS.COMPLETED, title: "Completed" },
                  { key: TABS.NO_SHOW, title: "No Show" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabType)}
              />
            </View>
          ) : (
            <LinearGradient
              colors={["#4361ee", "#3a0ca3"]}
              style={tw`p-5 rounded-2xl shadow-lg mb-6`}
            >
              <MyText style={tw`text-white text-2xl font-bold`}>
                Today's Tokens
              </MyText>
              <MyText style={tw`text-blue-100`}>
                {hospitalTokensData?.hospitalName || "Your Hospital"} -{" "}
                {hospitalTokensData?.date
                  ? formatDate(hospitalTokensData.date)
                  : "Today"}
              </MyText>
            </LinearGradient>
          )}

          {/* Loading state */}
          {(isLoadingHospital && !hospitalTokensData) ||
          (selectedDoctorId && isLoadingDoctor && !doctorTokensData) ? (
            <View style={tw`items-center justify-center py-12`}>
              <ActivityIndicator size="large" color="#4361ee" />
              <MyText style={tw`mt-4 text-gray-600`}>Loading tokens...</MyText>
            </View>
          ) : isHospitalError && !selectedDoctorId ? (
            <View
              style={tw`bg-red-50 p-5 rounded-2xl shadow mb-4 border border-red-200`}
            >
              <MyText style={tw`text-red-700 font-medium`}>
                Error loading tokens:{" "}
                {hospitalError instanceof Error
                  ? hospitalError.message
                  : "Unknown error"}
              </MyText>
              <TouchableOpacity
                style={tw`bg-blue-600 px-5 py-3 rounded-xl mt-4 self-start`}
                onPress={onRefresh}
              >
                <MyText style={tw`text-white font-bold`}>Retry</MyText>
              </TouchableOpacity>
            </View>
          ) : isDoctorError && selectedDoctorId ? (
            <View
              style={tw`bg-red-50 p-5 rounded-2xl shadow mb-4 border border-red-200`}
            >
              <MyText style={tw`text-red-700 font-medium`}>
                Error loading doctor's tokens:{" "}
                {doctorError instanceof Error
                  ? doctorError.message
                  : "Unknown error"}
              </MyText>
              <TouchableOpacity
                style={tw`bg-blue-600 px-5 py-3 rounded-xl mt-4 self-start`}
                onPress={onRefresh}
              >
                <MyText style={tw`text-white font-bold`}>Retry</MyText>
              </TouchableOpacity>
            </View>
          ) : selectedDoctorId ? (
            // Doctor detail view
            <View>
              {/* Current token indicator */}
              {doctorTokensData?.currentTokenNumber &&
                activeTab === "UPCOMING" && (
                  <LinearGradient
                    colors={["#3b82f6", "#2563eb"]}
                    style={tw`p-4 rounded-2xl shadow-lg mb-6 flex-row justify-between items-center`}
                  >
                    <View>
                      <MyText style={tw`text-white font-bold text-lg`}>
                        Current Token: #{doctorTokensData.currentTokenNumber}
                      </MyText>
                      <MyText style={tw`text-blue-100 mt-1`}>
                        {doctorTokensData.completedTokens} of{" "}
                        {doctorTokensData.totalTokens} completed
                      </MyText>
                    </View>
                    <View
                      style={tw`bg-white bg-opacity-20 px-4 py-2 rounded-full`}
                    >
                      <MyText style={tw`text-white font-bold`}>
                        IN PROGRESS
                      </MyText>
                    </View>
                  </LinearGradient>
                )}

              {/* Doctor's tokens list */}
              {doctorTokensData?.tokens &&
              doctorTokensData.tokens.length > 0 ? (
                filterTokensByStatus(doctorTokensData.tokens).map((token) => (
                  <DoctorTokenCard key={token.id} token={token} />
                ))
              ) : (
                <View
                  style={tw`bg-white p-8 rounded-2xl shadow-lg items-center`}
                >
                  <Ionicons name="calendar-outline" size={56} color="#9ca3af" />
                  <MyText style={tw`text-center text-gray-500 mt-4 text-lg`}>
                    No tokens available for this doctor today.
                  </MyText>
                </View>
              )}
            </View>
          ) : (
            // Hospital summary view - doctors list
            <View>
              {hospitalTokensData?.doctors &&
              hospitalTokensData.doctors.length > 0 ? (
                hospitalTokensData.doctors.map((doctor) => (
                  <View key={doctor.id} style={tw`mb-8`}>
                    <View style={tw`flex-row items-center mb-4`}>
                      <MyText style={tw`text-xl font-bold text-gray-800 mr-3`}>
                        {doctor.name}
                      </MyText>
                      <TouchableOpacity
                        style={tw`bg-blue-600 px-4 py-2 rounded-full shadow`}
                        onPress={() =>
                          router.push(
                            ("/(drawer)/todays-tokens/" + doctor.id) as any
                          )
                        }
                      >
                        <MyText style={tw`text-white text-xs font-bold`}>
                          Show All
                        </MyText>
                      </TouchableOpacity>
                    </View>
                    {doctor.tokens && doctor.tokens.length > 0 ? (
                      doctor.tokens.map((token) => (
                        <DoctorTokenCard key={token.id} token={token} />
                      ))
                    ) : (
                      <MyText style={tw`text-gray-500 mb-4`}>
                        No tokens for this doctor today.
                      </MyText>
                    )}
                  </View>
                ))
              ) : (
                <View
                  style={tw`bg-white p-8 rounded-2xl shadow-lg items-center`}
                >
                  <Ionicons name="medkit-outline" size={56} color="#9ca3af" />
                  <MyText style={tw`text-center text-gray-500 mt-4 text-lg`}>
                    No doctors with tokens available today.
                  </MyText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </AppContainer>
  );
}

// Doctor Summary Card Component
interface DoctorSummaryCardProps {
  doctor: DoctorTokenSummary;
  onPress: () => void;
}

const DoctorSummaryCard: React.FC<DoctorSummaryCardProps> = ({
  doctor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={tw`bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-blue-500`}
      onPress={onPress}
    >
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <View style={tw`flex-1`}>
          <MyText style={tw`text-lg font-bold`}>{doctor.name}</MyText>
          {doctor.specializations && doctor.specializations.length > 0 && (
            <MyText style={tw`text-gray-600 text-sm`}>
              {doctor.specializations.join(", ")}
            </MyText>
          )}
        </View>
        {doctor.currentTokenNumber && (
          <View style={tw`bg-blue-100 px-3 py-1 rounded-full`}>
            <MyText style={tw`text-blue-800 text-xs font-medium`}>
              Current: #{doctor.currentTokenNumber}
            </MyText>
          </View>
        )}
      </View>

      {/* Token statistics */}
      <View style={tw`flex-row justify-between mt-3`}>
        <View style={tw`items-center`}>
          <MyText style={tw`text-gray-500 text-xs`}>Total</MyText>
          <MyText style={tw`text-blue-600 font-bold`}>
            {doctor.totalTokens}
          </MyText>
        </View>
        <View style={tw`items-center`}>
          <MyText style={tw`text-gray-500 text-xs`}>Completed</MyText>
          <MyText style={tw`text-green-600 font-bold`}>
            {doctor.completedTokens}
          </MyText>
        </View>
        <View style={tw`items-center`}>
          <MyText style={tw`text-gray-500 text-xs`}>In Progress</MyText>
          <MyText style={tw`text-orange-500 font-bold`}>
            {doctor.inProgressTokens}
          </MyText>
        </View>
        <View style={tw`items-center`}>
          <MyText style={tw`text-gray-500 text-xs`}>Upcoming</MyText>
          <MyText style={tw`text-indigo-600 font-bold`}>
            {doctor.upcomingTokens}
          </MyText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Index;
