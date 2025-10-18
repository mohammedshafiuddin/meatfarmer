import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { MyText, tw, CustomDropdown, MyTextInput, MyButton } from "common-ui";
import { ThemedView } from "@/components/ThemedView";
import AppContainer from "@/components/app-container";
import { useGetMyDoctors } from "@/api-hooks/my-doctors.api";
import { useSearchUserByMobile } from "@/api-hooks/user.api";
import {
  useGetDoctorAvailabilityForNextDays,
  useCreateLocalToken,
} from "@/api-hooks/token.api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { SuccessToast } from "@/services/toaster";
import { GENDERS } from "common-ui/src/lib/constants";
import { token_user } from "common-ui/shared-types";
import { Chip } from "react-native-paper";
import { StorageServiceCasual } from "common-ui/src/services/StorageServiceCasual";

// The form to show after a patient is selected or "add new" is clicked
const PatientForm = ({
  patient,
  mobile,
  onSubmit,
}: {
  patient: token_user | null;
  mobile: string;
  onSubmit: (values: any) => void;
}) => {
  const handleSubmit = (values: any) => {
    console.log({values})
    
    onSubmit(values);
  }
  
  return (
    <Formik
      initialValues={{
        mobileNumber: mobile,
        patientName: patient?.name || "",
        age: patient?.age?.toString() || "",
        gender: patient?.gender || GENDERS[0],
        reason: "",
      }}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ handleChange, handleBlur, handleSubmit, values, setFieldValue }) => (
        <View style={tw`mt-6`}>
          <MyText style={tw`text-lg font-bold mb-4`}>
            {patient ? "Confirm Patient Details" : "New Patient Details"}
          </MyText>
          <MyTextInput
            placeholder="Patient Name"
            onChangeText={handleChange("patientName")}
            value={values.patientName}
            editable={!patient}
          />
          <MyTextInput
            placeholder="Age"
            onChangeText={handleChange("age")}
            value={values.age}
            keyboardType="number-pad"
            editable={!patient}
            style={tw`mt-4`}
          />
          <View style={tw`mt-4`}>
            <CustomDropdown
              label="Gender"
              options={GENDERS.map((g) => ({ label: g, value: g }))}
              onValueChange={(value) => setFieldValue("gender", value)}
              value={values.gender}
              disabled={!!patient}
            />
          </View>
          <MyTextInput
            style={tw`mt-4`}
            placeholder="Reason for visit (optional)"
            onChangeText={handleChange("reason")}
            value={values.reason}
            multiline
          />
          <View style={tw`mt-6`}>
            <MyButton
              textContent="Confirm and Proceed"
              onPress={() => handleSubmit()}
            />
          </View>
        </View>
      )}
    </Formik>
  );
};

const DOCTOR_SELECTION_KEY = 'selectedDoctorId';

export default function AddTokenScreen() {
  const router = useRouter();
  const {
    data: doctors,
    isLoading: doctorsLoading,
    isError: doctorsError,
  } = useGetMyDoctors({ enabled: true });
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const {
    data: availability,
    isLoading: availabilityLoading,
    isError: availabilityError,
  } = useGetDoctorAvailabilityForNextDays(selectedDoctorId || undefined, false);

  const [mobileNumber, setMobileNumber] = useState("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<token_user | null>(
    null
  );

  const { data: patients, isLoading: patientsLoading } =
    useSearchUserByMobile(mobileNumber);
  const { mutate: createLocalToken } = useCreateLocalToken();

  const handleSelectPatient = (patientId: number | string) => {
    const patient = patients?.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient as token_user);
      setShowNewPatientForm(false); // Hide new patient form if it was open
    }
  };

  const handleAddNewPatient = () => {
    setSelectedPatient(null);
    setShowNewPatientForm(true);
  };

  console.log({ selectedDoctorId });

  const handleFormSubmit = useCallback(
    (values: any) => {
      // console.log("Form submitted", values);
      const payload = {
        ...values,
        doctorId: selectedDoctorId,
      };
      // console.log({payload, selectedDoctorId})
      console.log({payload})

       createLocalToken(payload, {
         onSuccess: () => {
           SuccessToast("Token booked successfully!");

           // Reset patient-related form state only
           setMobileNumber("");
           setSelectedPatient(null);
           setShowNewPatientForm(false);

           // Keep the selected doctor unchanged for convenience
         },
         onError: (error: any) => {
           console.error("Error booking token:", error);
           // Could add ErrorToast here if not handled elsewhere
         },
       });
    },
    [selectedDoctorId, createLocalToken]
  );

  // Load stored doctor selection on mount
  useEffect(() => {
    const loadStoredDoctor = async () => {
      try {
        const storedDoctorId = await StorageServiceCasual.getItem(DOCTOR_SELECTION_KEY);
        if (storedDoctorId && doctors) {
          const doctorExists = doctors.some(doctor => doctor.id === parseInt(storedDoctorId));
          if (doctorExists) {
            setSelectedDoctorId(parseInt(storedDoctorId));
          } else {
            // Doctor no longer available, clear stored value
            await StorageServiceCasual.removeItem(DOCTOR_SELECTION_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading stored doctor:', error);
      }
    };

    if (doctors && doctors.length > 0 && selectedDoctorId === null) {
      loadStoredDoctor();
    }
  }, [doctors, selectedDoctorId]);

  // Transform doctors data into dropdown options
  const doctorOptions: any[] =
    doctors?.map((doctor) => ({
      label: `Dr. ${doctor.name}`,
      value: doctor.id,
    })) || [];

  // Handle doctor selection
  const handleDoctorSelection = async (doctorId: string | number) => {
    const id = typeof doctorId === "string" ? parseInt(doctorId) : doctorId;
    setSelectedDoctorId(id);

    try {
      await StorageServiceCasual.setItem(DOCTOR_SELECTION_KEY, id.toString());
    } catch (error) {
      console.error('Error saving doctor selection:', error);
    }
  };

  // Loading states
  if (doctorsLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color={tw.color("blue-500")} />
          <MyText style={tw`mt-4 text-lg`}>Loading doctors...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (doctorsError) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={tw.color("red-500")}
          />
          <MyText style={tw`text-red-500 text-center mt-4 text-lg`}>
            Failed to load doctors. Please try again later.
          </MyText>
        </View>
      </AppContainer>
    );
  }

  const renderAvailabilityContent = () => {
    if (availabilityLoading) {
      return (
        <View style={tw`items-center py-8`}>
          <ActivityIndicator size="large" color={tw.color("blue-500")} />
          <MyText style={tw`mt-4 text-gray-600`}>
            Checking availability...
          </MyText>
        </View>
      );
    }
    if (availabilityError) {
      return (
        <View style={tw`p-4 bg-red-50 rounded-lg`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons
              name="warning-outline"
              size={20}
              color={tw.color("red-500")}
            />
            <MyText style={tw`text-red-500 font-medium ml-2`}>
              Error Checking Availability
            </MyText>
          </View>
          <MyText style={tw`text-red-400 mt-2`}>
            Unable to fetch today's availability. Please try again.
          </MyText>
        </View>
      );
    }

    if (availability) {
      const availabilityList = availability.availabilities;
      const today = new Date().toISOString().split("T")[0];

      const todaysAvailability = availabilityList[0];

      if (!todaysAvailability || !todaysAvailability.availability) {
        return (
          <View style={tw`items-center py-6`}>
            <Ionicons
              name="calendar-clear-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <MyText style={tw`text-gray-500 text-center mt-3 mb-4`}>
              No availability information for today
            </MyText>
            <TouchableOpacity
              style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
              onPress={() => router.push(`/(drawer)/dashboard/doctor-details/${selectedDoctorId}` as any)}
            >
              <MyText style={tw`text-white font-medium`}>Set Availability</MyText>
            </TouchableOpacity>
          </View>
        );
      }

      
      const {
        isPaused,
        pauseReason,
        filledTokenCount,
        totalTokenCount,
        availableTokens,
      } = todaysAvailability.availability!;
      const filledPercentage =
        totalTokenCount > 0 ? (filledTokenCount / totalTokenCount) * 100 : 0;

      return (
        <View style={tw`p-1`}>
          {/* Status and Pause Reason */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-3 h-3 rounded-full mr-2`,
                  isPaused ? tw`bg-red-500` : tw`bg-green-500`,
                ]}
              />
              <MyText style={tw`font-bold text-lg`}>
                {isPaused ? "Paused" : "Available"}
              </MyText>
            </View>
            {isPaused && (
              <View style={tw`p-2 bg-red-100 rounded-lg`}>
                <MyText style={tw`text-red-700 text-xs`}>
                  {pauseReason || "No reason provided"}
                </MyText>
              </View>
            )}
          </View>

          {/* Token Progress */}
          <View style={tw`mb-5`}>
            <View style={tw`flex-row justify-between items-baseline mb-1`}>
              <MyText style={tw`text-gray-600`}>Tokens Issued</MyText>
              <MyText style={tw`font-bold text-xl`}>
                {filledTokenCount}
                <MyText style={tw`text-gray-500`}>/{totalTokenCount}</MyText>
              </MyText>
            </View>
            <View
              style={tw`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700`}
            >
              <View
                style={[
                  tw`bg-blue-600 h-2.5 rounded-full`,
                  { width: `${filledPercentage}%` },
                ]}
              />
            </View>
          </View>

          {/* Key Metrics */}
          <View style={tw`flex-row justify-around`}>
            <View style={tw`items-center`}>
              <MyText style={tw`text-gray-500 text-sm`}>Remaining</MyText>
              <MyText style={tw`font-bold text-2xl text-green-600`}>
                {availableTokens}
              </MyText>
            </View>
            <View style={tw`items-center`}>
              <MyText style={tw`text-gray-500 text-sm`}>Next Slot</MyText>
              <MyText style={tw`font-bold text-2xl text-orange-500`}>
                {filledTokenCount < totalTokenCount
                  ? `#${filledTokenCount + 1}`
                  : "Full"}
              </MyText>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={tw`items-center py-6`}>
        <Ionicons
          name="calendar-clear-outline"
          size={48}
          color={tw.color("gray-400")}
        />
        <MyText style={tw`text-gray-500 text-center mt-3`}>
          No availability information for today
        </MyText>
      </View>
    );
  };

  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`bg-blue-600 p-6 rounded-b-3xl mb-6`}>
          <MyText style={tw`text-2xl font-bold text-white mb-2`}>
            Add New Token
          </MyText>
          <MyText style={tw`text-white text-opacity-90`}>
            Select a doctor and view their availability
          </MyText>
        </View>

        <ScrollView
          style={tw`flex-1 px-4`}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor Selection Card */}
          <ThemedView
            style={tw`p-5 rounded-2xl shadow-md mb-6 border border-gray-200`}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <Ionicons
                name="person-add-outline"
                size={24}
                color={tw.color("blue-600")}
              />
              <MyText style={tw`text-xl font-bold ml-2`}>Select Doctor</MyText>
            </View>

            {doctors && doctors.length > 0 ? (
              <View style={tw`mb-2`}>
                <CustomDropdown
                  label="Available Doctors"
                  value={selectedDoctorId || ""}
                  options={doctorOptions}
                  onValueChange={handleDoctorSelection}
                  placeholder="Choose a doctor"
                />
              </View>
            ) : (
              <View style={tw`mb-4 p-4 bg-gray-100 rounded-lg`}>
                <MyText style={tw`text-center text-gray-600`}>
                  No doctors available. Please contact your administrator.
                </MyText>
              </View>
            )}
          </ThemedView>

          {/* Availability Card */}
          {(availabilityLoading || availability || availabilityError) && (
            <ThemedView
              style={tw`p-5 rounded-2xl shadow-md mb-6 border border-gray-200`}
            >
              <View style={tw`flex-row items-center mb-4`}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={tw.color("blue-600")}
                />
                <MyText style={tw`text-xl font-bold ml-2`}>
                  Today's Availability
                </MyText>
              </View>
              {renderAvailabilityContent()}
            </ThemedView>
          )}

          {/* Patient Details Card */}
          <ThemedView
            style={tw`p-5 rounded-2xl shadow-md mb-6 border border-gray-200`}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={tw.color("blue-600")}
              />
              <MyText style={tw`text-xl font-bold ml-2`}>
                Patient Details
              </MyText>
            </View>

            <MyTextInput
              placeholder="Enter 10-digit mobile number to search patient"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            {patientsLoading && <ActivityIndicator style={tw`mt-4`} />}

            {patients && patients.length > 0 && (
              <View style={tw`mt-4`}>
                <MyText style={tw`mb-2 text-gray-600`}>
                  Select from existing patients:
                </MyText>
                <View style={tw`flex-row flex-wrap`}>
                  {patients.map((p) => (
                    <Chip
                      key={p.id}
                      onPress={() => handleSelectPatient(p.id)}
                      style={tw`mr-2 mb-2`}
                      selected={selectedPatient?.id === p.id}
                    >
                      {`${p.name} (${p.age})`}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={tw`mt-4`}>
              <MyButton
                textContent="Add New Patient"
                onPress={handleAddNewPatient}
              />
            </View>

            {(selectedPatient || showNewPatientForm) && (
              <PatientForm
                patient={selectedPatient}
                mobile={mobileNumber}
                onSubmit={handleFormSubmit}
              />
            )}
          </ThemedView>
        </ScrollView>
      </View>
    </AppContainer>
  );
}
