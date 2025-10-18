import { MyText , MyButton , tw } from "common-ui";
import React from "react";
import { ScrollView, View, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useGetHospitals, useDeleteHospital } from "@/api-hooks/hospital.api";
import { Hospital } from "shared-types";
import { MaterialIcons } from '@expo/vector-icons';
import AppContainer from "@/components/app-container";

interface HospitalCardProps {
  hospital: Hospital;
  onDelete: () => void;
  onEdit: () => void;
}

/**
 * HospitalCard component to display individual hospital information
 */
const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onDelete, onEdit }) => {
  return (
    <View style={tw`p-5 border border-gray-200 rounded-xl mb-4 bg-white shadow-sm`}>
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3`}>
              <MaterialIcons name="local-hospital" size={24} color="#3b82f6" />
            </View>
            <View>
              <MyText style={tw`text-xl font-bold text-gray-800`}>{hospital.name}</MyText>
              {hospital.adminName && (
                <MyText style={tw`text-gray-600`}>Admin: {hospital.adminName}</MyText>
              )}
            </View>
          </View>
          
          {hospital.description && (
            <MyText style={tw`text-gray-600 mt-2 mb-4`}>{hospital.description}</MyText>
          )}
          
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <View style={tw`flex-row items-start`}>
              <MaterialIcons name="location-on" size={18} color="#94a3b8" style={tw`mr-2 mt-0.5`} />
              <MyText style={tw`text-gray-700 flex-1`}>{hospital.address}</MyText>
            </View>
          </View>
        </View>
      </View>
      
      <View style={tw`flex-row mt-4 pt-4 border-t border-gray-100 justify-end`}>
        <MyButton
          mode="outlined"
          textContent="Edit"
          onPress={onEdit}
          style={tw`mr-3 border-gray-300`}
        />
        <MyButton
          mode="outlined"
          textContent="Delete"
          onPress={onDelete}
          style={tw`border-red-300`}
        />
      </View>
    </View>
  );
};

function ManageHospitals() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetHospitals();
  const deleteHospitalMutation = useDeleteHospital();

  return (
    <AppContainer>
      <View style={tw`flex-1 p-4 bg-gray-50`}>
        <View style={tw`flex-col gap-6`}>
          <View style={tw`flex-col justify-between items-center mb-2 pb-4 border-b border-gray-200`}>
            <View>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="local-hospital" size={28} color="#3b82f6" style={tw`mr-2`} />
                <MyText style={tw`text-2xl font-bold text-gray-800`}>Manage Hospitals</MyText>
              </View>
              <MyText style={tw`text-gray-600 mt-1`}>
                {data?.hospitals?.length || 0} {data?.hospitals?.length === 1 ? 'hospital' : 'hospitals'} found
              </MyText>
            </View>
            <MyButton
              mode="contained"
              textContent="Add Hospital"
              onPress={() => {
                router.push("/(drawer)/admin-panel/manage-hospitals/add-hospital" as any);
              }}
              style={tw`bg-blue-500 mt-4`}
            />
          </View>

          {isLoading ? (
            <View style={tw`items-center py-12 bg-white rounded-xl shadow-sm`}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <MyText style={tw`mt-4 text-gray-600 font-medium`}>Loading hospitals...</MyText>
            </View>
          ) : isError ? (
            <View style={tw`p-8 bg-red-50 rounded-xl shadow-sm items-center`}>
              <View style={tw`w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4`}>
                <MaterialIcons name="error" size={32} color="#ef4444" />
              </View>
              <MyText style={tw`text-red-700 font-bold text-lg mb-2 text-center`}>
                Failed to load hospitals
              </MyText>
              <MyText style={tw`text-red-600 text-center mb-4`}>
                There was an error loading the hospitals
              </MyText>
              <MyButton
                mode="outlined"
                textContent="Try Again"
                onPress={() => refetch()}
                style={tw`border-red-300 mt-2`}
              />
            </View>
          ) : data?.hospitals && data.hospitals.length > 0 ? (
            <View>
              {data.hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  onEdit={() => {
                    // Navigate to edit hospital page
                    router.push(`/(drawer)/admin-panel/manage-hospitals/edit-hospital/${hospital.id}`);
                  }}
                  onDelete={() => {
                    Alert.alert(
                      "Delete Hospital",
                      `Are you sure you want to delete ${hospital.name}?`,
                      [
                        {
                          text: "Cancel",
                          style: "cancel"
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await deleteHospitalMutation.mutateAsync(hospital.id);
                              Alert.alert("Success", "Hospital deleted successfully");
                              refetch();
                            } catch (error: any) {
                              Alert.alert(
                                "Error",
                                error.message || "Failed to delete hospital"
                              );
                            }
                          }
                        }
                      ]
                    );
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={tw`items-center py-12 bg-white rounded-xl shadow-sm`}>
              <View style={tw`w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4`}>
                <MaterialIcons name="add-business" size={32} color="#94a3b8" />
              </View>
              <MyText style={tw`text-gray-600 text-lg mb-2 font-medium`}>No hospitals found</MyText>
              <MyText style={tw`text-gray-500 text-center mb-6`}>
                Get started by adding your first hospital
              </MyText>
              <MyButton
                mode="contained"
                textContent="Add Your First Hospital"
                onPress={() => {
                  router.push("/(drawer)/admin-panel/manage-hospitals/add-hospital" as any);
                }}
                style={tw`bg-blue-500`}
              />
            </View>
          )}
        </View>
      </View>
    </AppContainer>
  );
}

export default ManageHospitals;
