import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { tw , MyText , MyButton , Checkbox } from "common-ui";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useGetDoctorAvailabilityForNextDays, useUpdateDoctorAvailability } from "@/api-hooks/token.api";
import AppContainer from "@/components/app-container";
import { SuccessToast } from "@/services/toaster";
import dayjs from "dayjs";

const DoctorAvailabilityCalendar: React.FC = () => {
  const { doctorId } = useLocalSearchParams();
  const router = useRouter();
  const accentColor = useThemeColor(
    { light: "#4f46e5", dark: "#818cf8" },
    "tint"
  );
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Convert doctorId to number
  const doctorIdNumber = typeof doctorId === 'string' ? parseInt(doctorId, 10) : Number(doctorId);

  // Fetch availability data for 30 days
  const {
    data: availabilityData,
    isLoading,
    isError,
  } = useGetDoctorAvailabilityForNextDays(doctorIdNumber, true);

  // Setup mutation for updating availability
  const updateAvailabilityMutation = useUpdateDoctorAvailability();

  // Generate 30 days from today
  const generate30Days = () => {
    const days = [];
    const today = dayjs(); // Use dayjs for consistent date handling
    
    for (let i = 0; i < 30; i++) {
      const date = today.add(i, 'day');
      const dateString = date.format('YYYY-MM-DD');
      
      days.push({
        date: date,
        dateString: dateString,
        formatted: date.format('MMM DD')
      });
    }
    
    return days;
  };

  // State for day configurations
  const [dayConfigurations, setDayConfigurations] = useState<Record<string, { tokenCount: string; isOnLeave: boolean; isStopped: boolean }>>({});

  // Update day configurations when availability data changes
  useEffect(() => {
    if (availabilityData?.availabilities) {
      const newConfigs: Record<string, { tokenCount: string; isOnLeave: boolean; isStopped: boolean }> = {};
      
      availabilityData.availabilities.forEach((item: any) => {
        const dateStr = item.date;
        newConfigs[dateStr] = {
          tokenCount: item.availability?.totalTokenCount?.toString() || "0",
          isOnLeave: item.availability?.isLeave || false,
          isStopped: item.availability?.isStopped || false
        };
      });
      
      setDayConfigurations(newConfigs);
    }
  }, [availabilityData]);

  // Get availability for a specific date
  const getAvailabilityForDate = (dateString: string) => {
    if (!availabilityData?.availabilities) return null;
    
    return availabilityData.availabilities.find((item: any) => item.date === dateString)?.availability;
  };

  // Update availability for a specific day
  const updateAvailabilityForDay = (dateString: string) => {
    const config = dayConfigurations[dateString];
    if (!config) return;

    const newTokenCount = parseInt(config.tokenCount, 10) || 0;
    
    const update = {
      doctorId: doctorIdNumber,
      date: dateString,
      tokenCount: newTokenCount,
      isStopped: config.isStopped,
      consultationsDone: 0, // Default value, can be updated if needed
      isLeave: config.isOnLeave,
    };

    updateAvailabilityMutation.mutate([update], {
      onSuccess: () => {
        setSuccessMessage("Availability updated successfully");
        SuccessToast("Availability updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
      onError: (error) => {
        console.error("Error updating availability:", error);
        SuccessToast("Failed to update availability. Please try again.");
        Alert.alert(
          "Error",
          "Failed to update availability. Please try again."
        );
        setSuccessMessage("");
      },
    });
  };

  // Handle token count change
  const handleTokenCountChange = (dateString: string, value: string) => {
    setDayConfigurations(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        tokenCount: value
      }
    }));
  };

  // Handle leave toggle
  const handleLeaveToggle = (dateString: string) => {
    setDayConfigurations(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        isOnLeave: !prev[dateString].isOnLeave
      }
    }));
  };

  // Handle stop toggle
  const handleStopToggle = (dateString: string) => {
    setDayConfigurations(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        isStopped: !prev[dateString].isStopped
      }
    }));
  };

  if (isNaN(doctorIdNumber)) {
    return (
      <AppContainer>
        <View style={tw`flex-1 p-4 justify-center items-center`}>
          <MyText style={tw`text-red-500 text-lg text-center mb-4`}>
            Invalid doctor ID
          </MyText>
          <MyButton onPress={() => router.back()} textContent="Go Back" />
        </View>
      </AppContainer>
    );
  }

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accentColor} />
          <MyText style={tw`mt-2`}>Loading availability...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (isError) {
    return (
      <AppContainer>
        <View style={tw`flex-1 p-4 justify-center items-center`}>
          <MyText style={tw`text-red-500 text-lg text-center mb-4`}>
            Failed to load availability. Please try again later.
          </MyText>
          <MyButton onPress={() => router.back()} textContent="Go Back" />
        </View>
      </AppContainer>
    );
  }

  const thirtyDays = generate30Days();

  return (
    <AppContainer>
      <View style={tw`p-4`}>
        <MyText style={tw`text-xl font-bold mb-4 text-center`}>
          30-Day Availability Planner
        </MyText>

        {/* <ScrollView style={tw`flex-1 mb-4`}> */}
          {thirtyDays.map((dayInfo, index) => {
            const isToday = dayjs().format('YYYY-MM-DD') === dayInfo.dateString;
            const config = dayConfigurations[dayInfo.dateString] || { 
              tokenCount: "0", 
              isOnLeave: false, 
              isStopped: false 
            };

            return (
              <View 
                key={index} 
                style={tw`p-3 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow border ${
                  isToday ? "border-2 border-indigo-500" : "border border-gray-200 dark:border-gray-700"
                }`}
              >
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <MyText style={[
                    tw`font-medium`,
                    { 'text-indigo-600 dark:text-indigo-400': isToday }
                  ]}>
                    {dayInfo.formatted}
                  </MyText>
                  {isToday && (
                    <MyText style={tw`text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full`}>
                      Today
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-2`}>
                  <MyText style={tw`mb-1 text-sm`}>Appointments Available:</MyText>
                  <View style={tw`flex-row items-center`}>
                    <TextInput
                      style={tw`flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
                      value={config?.tokenCount || "0"}
                      onChangeText={(value) => handleTokenCountChange(dayInfo.dateString, value)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>

                <View style={tw`flex-row items-center mb-2`}>
                    <Checkbox
                      checked={config?.isOnLeave || false}
                      onPress={() => handleLeaveToggle(dayInfo.dateString)}
                    />
                    <MyText style={tw`ml-2`}>On Leave</MyText>
                  </View>

                  <View style={tw`flex-row items-center mb-3`}>
                    <Checkbox
                      checked={config?.isStopped || false}
                      onPress={() => handleStopToggle(dayInfo.dateString)}
                    />
                    <MyText style={tw`ml-2`}>Stop New Tokens</MyText>
                  </View>

                <MyButton
                  style={tw`mt-1`}
                  onPress={() => updateAvailabilityForDay(dayInfo.dateString)}
                  textContent="Save"
                />
              </View>
            );
          })}
        {/* </ScrollView> */}

        {successMessage ? (
          <View style={tw`mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg`}>
            <MyText style={tw`text-green-700 dark:text-green-300 text-center font-medium`}>
              {successMessage}
            </MyText>
          </View>
        ) : null}
      </View>
    </AppContainer>
  );
};

export default DoctorAvailabilityCalendar;