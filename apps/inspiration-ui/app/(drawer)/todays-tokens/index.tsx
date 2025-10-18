import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AppContainer from "@/components/app-container";
import { BottomDropdown, MyText, SearchBar , tw } from "common-ui";
import { useDoctorTodaysTokens, useSearchDoctorTokens } from "@/api-hooks/token.api";
import { DoctorTodayToken } from "common-ui/shared-types";
import { Ionicons } from "@expo/vector-icons";
import DoctorTokenCard from "./DoctorTokenCard";
import { LinearGradient } from "expo-linear-gradient";
import TabNavigation from "@/components/TabNavigation";
import { useGetMyDoctors } from "@/api-hooks/my-doctors.api";

export default function DoctorTokensPage() {
  const router = useRouter();

  const [currDoctorId, setCurrDoctorId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const doctorId = currDoctorId;
  // Define tab configuration
  const TABS = {
    UPCOMING: "UPCOMING",
    COMPLETED: "COMPLETED",
    NO_SHOW: "NO_SHOW",
  } as const;

  type TabType = keyof typeof TABS;

  const [activeTab, setActiveTab] = useState<TabType>("UPCOMING");

  const { data, isLoading, isError, error, refetch } =
    useDoctorTodaysTokens(doctorId);
  const { data: doctorsData } = useGetMyDoctors({ enabled: true });
  const { data: searchResults } = useSearchDoctorTokens(doctorId, searchText);

  React.useEffect(() => {
    if (doctorsData && doctorsData.length > 0) {
      const firstDoctorId = doctorsData[0].id;
      setCurrDoctorId(firstDoctorId);
    }
  }, [doctorsData]);

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
      <ScrollView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`p-5`}>
          <View style={tw`flex-col mb-4`}>
            <View style={tw`flex-1 `}>
              <BottomDropdown
                // value={doctorId.toString()}
                value={String(currDoctorId)}
                onChange={(id) => setCurrDoctorId(Number(id))}
                options={
                  doctorsData?.map((doc) => ({
                    label: doc.name,
                    value: String(doc.id),
                  })) || []
                }
              />
            </View>
            <SearchBar
              containerStyle={tw`flex-1 mt-4`}
              value={searchText}
              onChangeText={setSearchText}
              onSearch={() => {
                // TODO: Implement search functionality
              }}
              placeholder="Search..."
            />
          </View>

          {!searchText ? (
            <>
              <TabNavigation
                tabs={[
                  { key: TABS.UPCOMING, title: "Upcoming" },
                  { key: TABS.COMPLETED, title: "Completed" },
                  { key: TABS.NO_SHOW, title: "No Show" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabType)}
              />

              {isLoading ? (
                <View style={tw`items-center justify-center py-12`}>
                  <ActivityIndicator size="large" color="#4361ee" />
                  <MyText style={tw`mt-4 text-gray-600`}>
                    Loading tokens...
                  </MyText>
                </View>
              ) : isError ? (
                <View
                  style={tw`bg-red-50 p-5 rounded-2xl shadow mb-4 border border-red-200`}
                >
                  <MyText style={tw`text-red-700 font-medium`}>
                    Error loading tokens:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                  </MyText>
                  <TouchableOpacity
                    style={tw`bg-blue-600 px-5 py-3 rounded-xl mt-4 self-start`}
                    onPress={() => refetch()}
                  >
                    <MyText style={tw`text-white font-bold`}>Retry</MyText>
                  </TouchableOpacity>
                  <ViewDoctorDetailsButton doctorId={doctorId!} />
                </View>
              ) : data?.tokens && data.tokens.length > 0 ? (
                filterTokensByStatus(data.tokens).map(
                  (token: DoctorTodayToken) => (
                    <DoctorTokenCard key={token.id} token={token} />
                  )
                )
              ) : (
                <View
                  style={tw`bg-white p-8 rounded-2xl shadow-lg items-center`}
                >
                  <Ionicons name="calendar-outline" size={56} color="#9ca3af" />
                  <MyText style={tw`text-center text-gray-500 mt-4 text-lg`}>
                    No tokens available for this doctor today.
                  </MyText>
                  <ViewDoctorDetailsButton doctorId={doctorId!} />
                </View>
              )}
            </>
          ) : (
            <View style={tw`bg-white p-8 rounded-2xl shadow-lg`}>
              {searchResults?.map((token) => <DoctorTokenCard key={token.id} token={token} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </AppContainer>
  );
}


interface ViewDoctorDetailsButtonProps {
  doctorId: number;
}

const ViewDoctorDetailsButton: React.FC<ViewDoctorDetailsButtonProps> = ({ doctorId }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/(drawer)/dashboard/doctor-details/${doctorId}`);
  };

  return (
    <TouchableOpacity
      style={tw`bg-blue-500 px-5 py-3 rounded-xl mt-4`}
      onPress={handlePress}
    >
      <MyText style={tw`text-white font-bold text-center`}>Open Token Slots</MyText>
    </TouchableOpacity>
  );
};