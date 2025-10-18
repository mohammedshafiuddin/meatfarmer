import React, { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { tw , MyText } from "common-ui";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/components/context/auth-context";
import { useHospitalAdminDashboard } from "@/api-hooks/hospital.api";
import {
  useHospitalTodaysTokens,
  useUpdateDoctorAvailability,
} from "@/api-hooks/token.api";
import { ErrorToast, SuccessToast } from "@/services/toaster";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { DashboardDoctor } from "common-ui/shared-types";
import OfflineTokenDialog from "./OfflineTokenDialog";

interface HospitalAdminDashboardProps {
  // Add any props you might need to pass to the dashboard
}

const HospitalAdminDashboard: React.FC<HospitalAdminDashboardProps> = () => {
  const { responsibilities } = useAuth();
  const hospitalId = responsibilities?.hospitalAdminFor;
  const [refreshing, setRefreshing] = React.useState(false);
  // State for tracking updates
  const [updatingDoctor, setUpdatingDoctor] = useState<string | null>(null);
  // State for issue new token dialog
  const [isIssueTokenDialogOpen, setIsIssueTokenDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DashboardDoctor | null>(
    null
  );

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useHospitalAdminDashboard(hospitalId);

  // Setup mutation for updating availability with destructured properties
  const {
    mutate: updateAvailability,
    isPending: isUpdatingAvailability,
    isError: hasUpdateError,
    error: updateError,
  } = useUpdateDoctorAvailability();

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      ErrorToast("Failed to refresh dashboard data");
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Function to adjust tokens issued (filledTokenCount)
  const adjustTokensIssued = (doctor: DashboardDoctor, increment: boolean) => {
    if (!dashboardData) return;

    // Calculate new filled token count
    let newTokensIssued = doctor.tokensIssuedToday + (increment ? 1 : -1);

    // Ensure filled count doesn't go below 0 or above total
    if (newTokensIssued < 0) newTokensIssued = 0;
    if (newTokensIssued > doctor.totalTokenCount)
      newTokensIssued = doctor.totalTokenCount;

    // If nothing changed, exit early
    if (newTokensIssued === doctor.tokensIssuedToday) return;

    // Show updating state
    setUpdatingDoctor(`${doctor.id}-tokens`);

    // Prepare the update payload
    const update = {
      doctorId: doctor.id,
      date: dashboardData.currentDate,
      tokenCount: doctor.totalTokenCount,
      filledTokenCount: newTokensIssued,
      consultationsDone: doctor.consultationsDone,
      isStopped: !doctor.isAvailable,
    };

    // Send the update to the server
    updateAvailability([update], {
      onSuccess: () => {
        SuccessToast("Tokens updated successfully");
      },
      onError: (err: Error) => {
        console.error("Error updating tokens:", err);
        Alert.alert(
          "Update Failed",
          "Failed to update tokens. Please try again."
        );
      },
      onSettled: () => {
        setUpdatingDoctor(null);
        refetch(); // Refresh data to get the latest counts after the update completes
      },
    });
  };

  // Function to adjust consultations done count
  const adjustConsultationsDone = (
    doctor: DashboardDoctor,
    increment: boolean
  ) => {
    if (!dashboardData) return;

    // Calculate new consultations done count
    let newConsultationsDone = doctor.consultationsDone + (increment ? 1 : -1);

    // Ensure consultations done count doesn't go below 0
    if (newConsultationsDone < 0) newConsultationsDone = 0;

    // If nothing changed, exit early
    if (newConsultationsDone === doctor.consultationsDone) return;

    // Show updating state
    setUpdatingDoctor(`${doctor.id}-consultations`);

    // Prepare the update payload
    const update = {
      doctorId: doctor.id,
      date: dashboardData.currentDate,
      tokenCount: doctor.totalTokenCount,
      filledTokenCount: doctor.tokensIssuedToday,
      consultationsDone: newConsultationsDone,
      isStopped: !doctor.isAvailable,
    };

    // Send the update to the server
    updateAvailability([update], {
      onSuccess: () => {
        SuccessToast("Consultations count updated successfully");
      },
      onError: (err: Error) => {
        console.error("Error updating consultations:", err);
        Alert.alert(
          "Update Failed",
          "Failed to update consultations count. Please try again."
        );
      },
      onSettled: () => {
        setUpdatingDoctor(null);
        refetch(); // Refresh data to get the latest counts after the update completes
      },
    });
  };

  // Function to handle issuing new token
  const onIssueNewToken = (doctor: DashboardDoctor) => {
    setSelectedDoctor(doctor);
    setIsIssueTokenDialogOpen(true);
  };

  // Show API update error if there was an issue updating
  React.useEffect(() => {
    if (hasUpdateError && updateError) {
      ErrorToast(`Update failed: ${updateError.message || "Unknown error"}`);
    }
  }, [hasUpdateError, updateError]);

  // Show error state if there was an error fetching data
  if (isError) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center p-4`}>
        <MyText style={tw`text-red-500 text-lg mb-4`}>
          Error loading dashboard: {error?.message || "Unknown error"}
        </MyText>
        <View
          style={tw`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-800`}
        >
          <MyText style={tw`text-center text-gray-700 dark:text-gray-300`}>
            We couldn't load your dashboard data. Please try again later.
          </MyText>
        </View>
      </ThemedView>
    );
  }

  // Render loading state
  if (isLoading || !dashboardData) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0891b2" />
        <MyText style={tw`mt-4 text-lg text-gray-700 dark:text-gray-300`}>
          Loading dashboard...
        </MyText>
      </ThemedView>
    );
  }

  // Render dashboard with data
  return (
    <ThemedView style={tw`flex-1 bg-gray-50 dark:bg-gray-900`}>
      <ScrollView
        contentContainerStyle={tw`p-4 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0891b2"
          />
        }
      >
        {/* Hospital Info Card */}
        <LinearGradient
          colors={
            ["#0d9488", "#0891b2"] as readonly [string, string, ...string[]]
          }
          style={tw`p-6 rounded-2xl shadow-lg mb-6`}
        >
          <MyText style={tw`text-white text-2xl font-bold mb-2`}>
            {dashboardData.hospital.name}
          </MyText>
          <MyText style={tw`text-cyan-100 mb-4`}>
            {dashboardData.hospital.address}
          </MyText>
          {dashboardData.hospital.description && (
            <MyText style={tw`text-white mb-2`}>
              {dashboardData.hospital.description}
            </MyText>
          )}
          <View
            style={tw`mt-4 pt-4 border-t border-cyan-400 border-opacity-30`}
          >
            <MyText style={tw`text-cyan-100 text-sm`}>
              Today: {dashboardData.currentDate}
            </MyText>
          </View>
        </LinearGradient>

        {/* Stats Summary */}
        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
          <StatCard
            title="Total Doctors"
            value={dashboardData.totalDoctors}
            colors={["#3b82f6", "#4f46e5"] as [string, string, ...string[]]}
            textColor="text-white"
          />
          <StatCard
            title="Today's Appointments"
            value={dashboardData.totalAppointmentsToday}
            colors={["#10b981", "#0d9488"] as [string, string, ...string[]]}
            textColor="text-white"
          />
          <StatCard
            title="Consultations Done"
            value={dashboardData.totalConsultationsDone}
            colors={["#8b5cf6", "#d946ef"] as [string, string, ...string[]]}
            textColor="text-white"
          />
        </View>

        {/* Doctors List */}
        <MyText
          style={tw`text-xl font-bold mb-4 text-gray-800 dark:text-gray-200`}
        >
          Doctors
        </MyText>
        {dashboardData.doctors.length === 0 ? (
          <View style={tw`bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg`}>
            <MyText style={tw`text-center text-gray-600 dark:text-gray-400`}>
              No doctors found for this hospital.
            </MyText>
          </View>
        ) : (
          (dashboardData.doctors as DashboardDoctor[]).map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onAdjustTokens={adjustTokensIssued}
              onAdjustConsultations={adjustConsultationsDone}
              onIssueNewToken={onIssueNewToken}
              isUpdating={
                isUpdatingAvailability &&
                (updatingDoctor === `${doctor.id}-tokens` ||
                  updatingDoctor === `${doctor.id}-consultations`)
              }
            />
          ))
        )}
      </ScrollView>

      {/* Issue New Token Dialog */}
      {selectedDoctor && (
        <OfflineTokenDialog
          open={isIssueTokenDialogOpen}
          onClose={() => setIsIssueTokenDialogOpen(false)}
          doctorId={selectedDoctor.id}
          doctorName={selectedDoctor.name}
          onSuccess={refetch} // Refresh the dashboard data after successful token creation
        />
      )}
    </ThemedView>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  colors: [string, string, ...string[]]; // At least 2 colors required by LinearGradient
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  colors,
  textColor = "text-white",
}) => (
  <LinearGradient
    colors={colors as readonly [string, string, ...string[]]} // Type assertion to match LinearGradient requirement
    style={tw`p-4 rounded-2xl shadow-lg mb-4 w-[31%]`}
  >
    <MyText style={tw`text-center text-3xl font-bold ${textColor}`}>
      {value}
    </MyText>
    <MyText style={tw`text-center text-sm mt-1 ${textColor} opacity-90`}>
      {title}
    </MyText>
  </LinearGradient>
);

// Doctor Card Component
interface DoctorCardProps {
  doctor: DashboardDoctor;
  onAdjustTokens: (doctor: DashboardDoctor, increment: boolean) => void;
  onAdjustConsultations: (doctor: DashboardDoctor, increment: boolean) => void;
  isUpdating: boolean;
  onIssueNewToken: (doctor: DashboardDoctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onAdjustTokens,
  onAdjustConsultations,
  isUpdating,
  ...props
}) => {
  const router = useRouter();

  const navigateToDoctorDetails = () => {
    router.push(`/(drawer)/dashboard/doctor-details/${doctor.id}` as any);
  };

  const [issuedTokens, setIssuedTokens] = useState(doctor.tokensIssuedToday);
  const [consultationsDone, setConsultationsDone] = useState(
    doctor.consultationsDone
  );

  React.useEffect(() => {
    setIssuedTokens(doctor.tokensIssuedToday);
    setConsultationsDone(doctor.consultationsDone);
  }, [doctor]);

  return (
    <View
      style={tw`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg mb-5 border border-gray-100 dark:border-gray-700`}
    >
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <TouchableOpacity onPress={navigateToDoctorDetails}>
          <MyText
            style={tw`text-lg font-bold text-blue-600 dark:text-blue-400`}
          >
            {doctor.name}
          </MyText>
        </TouchableOpacity>
        <View
          style={tw`${
            doctor.isAvailable
              ? "bg-green-100 dark:bg-green-900"
              : "bg-red-100 dark:bg-red-900"
          } px-3 py-1 rounded-full`}
        >
          <MyText
            style={tw`${
              doctor.isAvailable
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            } text-xs font-semibold`}
          >
            {doctor.isAvailable ? "Available" : "Unavailable"}
          </MyText>
        </View>
      </View>

      {doctor.qualifications && (
        <MyText style={tw`text-gray-600 dark:text-gray-400 mb-4 italic`}>
          {doctor.qualifications}
        </MyText>
      )}

      <View style={tw`flex-row flex-wrap justify-between mt-3`}>
        {/* Tokens Issued with adjustment buttons */}
        <View
          style={tw`mb-4 w-[48%] bg-gray-50 dark:bg-gray-700 p-3 rounded-xl`}
        >
          <MyText style={tw`text-xs text-gray-500 dark:text-gray-400 mb-2`}>
            Tokens Issued
          </MyText>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={tw`w-10 h-10 ${
                isUpdating
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-600"
              } rounded-full items-center justify-center ${
                doctor.tokensIssuedToday <= 0 ? "opacity-50" : ""
              }`}
              onPress={() => {
                setIssuedTokens((prev) => prev - 1);
                onAdjustTokens(doctor, false);
              }}
              disabled={isUpdating || doctor.tokensIssuedToday <= 0}
            >
              <MyText
                style={tw`text-xl font-bold text-gray-700 dark:text-gray-300`}
              >
                -
              </MyText>
            </TouchableOpacity>
            <View style={tw`flex-row items-center min-w-[30px] justify-center`}>
              <MyText
                style={tw`text-lg font-bold text-gray-800 dark:text-gray-200`}
              >
                {issuedTokens}
                <MyText
                  style={tw`text-sm font-normal text-gray-500 dark:text-gray-400`}
                >
                  /{doctor.totalTokenCount}
                </MyText>
              </MyText>
            </View>
            <TouchableOpacity
              style={tw`w-10 h-10 ${
                isUpdating
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-600"
              } rounded-full items-center justify-center ${
                doctor.tokensIssuedToday >= doctor.totalTokenCount
                  ? "opacity-50"
                  : ""
              }`}
              onPress={() => {
                setIssuedTokens((prev) => prev + 1);
                onAdjustTokens(doctor, true);
              }}
              disabled={
                isUpdating || doctor.tokensIssuedToday >= doctor.totalTokenCount
              }
            >
              <MyText
                style={tw`text-xl font-bold text-gray-700 dark:text-gray-300`}
              >
                +
              </MyText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consultations Done with adjustment buttons */}
        <View
          style={tw`mb-4 w-[48%] bg-gray-50 dark:bg-gray-700 p-3 rounded-xl`}
        >
          <MyText style={tw`text-xs text-gray-500 dark:text-gray-400 mb-2`}>
            Consultations Done
          </MyText>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={tw`w-10 h-10 ${
                isUpdating
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-600"
              } rounded-full items-center justify-center ${
                doctor.consultationsDone <= 0 ? "opacity-50" : ""
              }`}
              onPress={() => {
                setConsultationsDone((prev) => prev - 1);
                onAdjustConsultations(doctor, false);
              }}
              disabled={isUpdating || doctor.consultationsDone <= 0}
            >
              <MyText
                style={tw`text-xl font-bold text-gray-700 dark:text-gray-300`}
              >
                -
              </MyText>
            </TouchableOpacity>
            <View style={tw`flex-row items-center min-w-[30px] justify-center`}>
              <MyText
                style={tw`text-lg font-bold text-gray-800 dark:text-gray-200`}
              >
                {consultationsDone}
              </MyText>
            </View>
            <TouchableOpacity
              style={tw`w-10 h-10 ${
                isUpdating
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-600"
              } rounded-full items-center justify-center`}
              onPress={() => {
                setConsultationsDone((prev) => prev + 1);
                onAdjustConsultations(doctor, true);
              }}
              disabled={isUpdating}
            >
              <MyText
                style={tw`text-xl font-bold text-gray-700 dark:text-gray-300`}
              >
                +
              </MyText>
            </TouchableOpacity>
          </View>
        </View>

        <ConsultationInfo
          label="Available Tokens"
          value={doctor.availableTokens}
        />
        <ConsultationInfo
          label="Current No."
          value={doctor.currentConsultationNumber}
        />
        <ConsultationInfo
          label="Fee"
          value={`₹${doctor.consultationFee}`}
          isPrice
        />
        <TouchableOpacity
          style={tw`mt-3 w-full bg-blue-500 p-3 rounded-xl items-center`}
          onPress={() => props.onIssueNewToken(doctor)}
        >
          <MyText style={tw`text-white font-bold`}>Issue New Token</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Consultation Info Component
interface ConsultationInfoProps {
  label: string;
  value: number | string;
  isPrice?: boolean;
}

const ConsultationInfo: React.FC<ConsultationInfoProps> = ({
  label,
  value,
  isPrice = false,
}) => (
  <View
    style={tw`mb-3 ${
      isPrice ? "w-full" : "w-[30%]"
    } bg-gray-50 dark:bg-gray-700 p-2 rounded-lg`}
  >
    <MyText style={tw`text-xs text-gray-500 dark:text-gray-400`}>
      {label}
    </MyText>
    <MyText style={tw`text-sm font-bold text-gray-800 dark:text-gray-200 mt-1`}>
      {value}
    </MyText>
  </View>
);

export default HospitalAdminDashboard;
