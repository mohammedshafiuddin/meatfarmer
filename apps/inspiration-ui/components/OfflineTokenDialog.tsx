import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  ActivityIndicator,
} from "react-native";
import { tw , MyText , BottomDialog , MyTextInput , MyButton } from "common-ui";
import  CustomDropdown from "common-ui/src/components/dropdown";
import dayjs from "dayjs";
import { useCreateOfflineToken } from "@/api-hooks/token.api";
import { useSearchUserByMobile } from "@/api-hooks/user.api";
import { ErrorToast, SuccessToast } from "@/services/toaster";
import { Chip } from "react-native-paper";
import { token_user } from "common-ui/shared-types";
import { GENDERS } from "common-ui/src/lib/constants";

interface OfflineTokenDialogProps {
  open: boolean;
  onClose: () => void;
  doctorId: number;
  doctorName: string;
  onSuccess?: () => void;
}

const OfflineTokenDialog: React.FC<OfflineTokenDialogProps> = ({
  open,
  onClose,
  doctorId,
  doctorName,
  onSuccess,
}) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<token_user | null>(null);
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(GENDERS[0]);
  const [symptoms, setSymptoms] = useState("");
  // Date for the token (default to current date)
  const [tokenDate, setTokenDate] = useState(dayjs().format('YYYY-MM-DD'));

  const { data: patients, isLoading: patientsLoading } = useSearchUserByMobile(mobileNumber);

  // Setup mutation for creating offline token
  const {
    mutate: createOfflineToken,
    isPending: isCreatingToken
  } = useCreateOfflineToken();

  const handleSelectPatient = (patientId: number | string) => {
    const patient = patients?.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient as token_user);
      setShowNewPatientForm(false);
    }
  };

  const handleAddNewPatient = () => {
    setSelectedPatient(null);
    setShowNewPatientForm(true);
  };

  const handleCreateOfflineToken = () => {
    const finalPatientName = selectedPatient ? selectedPatient.name : patientName.trim();
    const finalPatientMobile = selectedPatient ? selectedPatient.mobile : mobileNumber.trim();

    if (!finalPatientName || !finalPatientMobile) {
      alert("Please fill in both patient name and mobile number");
      return;
    }

    createOfflineToken(
      {
        doctorId: doctorId,
        patientName: finalPatientName,
        patientMobile: finalPatientMobile,
        symptoms: symptoms.trim(),
        date: tokenDate,
      },
      {
        onSuccess: () => {
          SuccessToast("Token issued successfully");
          resetForm();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        },
        onError: (error: Error) => {
          console.error("Error creating offline token:", error);
          ErrorToast(`Failed to issue token: ${error.message}`);
        },
      }
    );
  };

  const resetForm = () => {
    setMobileNumber("");
    setShowNewPatientForm(false);
    setSelectedPatient(null);
    setPatientName("");
    setAge("");
    setGender(GENDERS[0]);
    setSymptoms("");
    setTokenDate(dayjs().format('YYYY-MM-DD'));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BottomDialog open={open} onClose={handleClose}>
      <View style={tw`p-5`}>
        <MyText
          style={tw`text-xl font-bold mb-4 text-gray-800 dark:text-gray-200`}
        >
          Issue New Token
        </MyText>

        <MyText
          style={tw`text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300`}
        >
          Doctor: {doctorName}
        </MyText>

        <View style={tw`mb-4`}>
          <CustomDropdown
            label="Date"
            value={tokenDate}
            options={[{ label: dayjs(tokenDate).format('DD MMM YYYY'), value: tokenDate }]}
            onValueChange={() => {}}
            disabled={true}
            placeholder="Select Date"
          />
        </View>

        {/* Patient Search */}
        <View style={tw`mb-4`}>
          <MyText style={tw`text-sm mb-1 text-gray-600 dark:text-gray-400`}>
            Patient Mobile Number
          </MyText>
          <MyTextInput
            placeholder="Enter 10-digit mobile number to search patient"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
          />
        </View>

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

        {/* Patient Form */}
        {(selectedPatient || showNewPatientForm) && (
          <View style={tw`mt-6`}>
            <MyText style={tw`text-lg font-bold mb-4`}>
              {selectedPatient ? "Confirm Patient Details" : "New Patient Details"}
            </MyText>

            <MyTextInput
              placeholder="Patient Name"
              onChangeText={setPatientName}
              value={selectedPatient ? selectedPatient.name : patientName}
              editable={!selectedPatient}
              style={tw`mb-4`}
            />

            <MyTextInput
              placeholder="Age"
              onChangeText={setAge}
              value={selectedPatient ? (selectedPatient.age?.toString() || "") : age}
              keyboardType="number-pad"
              editable={!selectedPatient}
              style={tw`mb-4`}
            />

            <View style={tw`mb-4`}>
              <CustomDropdown
                label="Gender"
                options={GENDERS.map((g) => ({ label: g, value: g }))}
                onValueChange={(value) => setGender(value as string)}
                value={selectedPatient ? selectedPatient.gender : gender}
                disabled={!!selectedPatient}
              />
            </View>

            <MyTextInput
              style={tw`mb-4`}
              placeholder="Symptoms (optional)"
              onChangeText={setSymptoms}
              value={symptoms}
              multiline
            />
          </View>
        )}

        <View style={tw`flex-row justify-between mt-6`}>
          <TouchableOpacity
            style={tw`flex-1 mr-2 bg-gray-300 dark:bg-gray-600 p-3 rounded-lg items-center`}
            onPress={handleClose}
          >
            <MyText style={tw`text-gray-800 dark:text-white font-bold`}>
              Cancel
            </MyText>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 ml-2 bg-blue-500 p-3 rounded-lg items-center`}
            onPress={handleCreateOfflineToken}
            disabled={isCreatingToken}
          >
            <MyText style={tw`text-white font-bold`}>
              {isCreatingToken ? "Issuing..." : "Issue Token"}
            </MyText>
          </TouchableOpacity>
        </View>
      </View>
    </BottomDialog>
  );
};

export default OfflineTokenDialog;