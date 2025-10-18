import { MyText , tw } from "common-ui";
import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import AddBusinessUserForm from "@/components/add-business-user-form";
import { MaterialIcons } from "@expo/vector-icons";
import AppContainer from "@/components/app-container";

function AddBusinessUser() {
  const router = useRouter();

  return (
    <AppContainer>
      <View style={tw`flex-col gap-4`}>
        <View style={tw`items-center mb-6`}>
          <View
            style={tw`w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4`}
          >
            <MaterialIcons name="person-add" size={32} color="#3b82f6" />
          </View>
          <MyText style={tw`text-2xl font-bold text-gray-800`}>
            Add New Business User
          </MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>
            Fill in the details below to create a new business user
          </MyText>
        </View>
        <View
          style={tw`bg-white rounded-xl shadow-sm p-5 border border-gray-100`}
        >
          <AddBusinessUserForm
            onSuccess={() =>
              router.push("/(drawer)/admin-panel/manage-business-users")
            }
          />
        </View>
      </View>
    </AppContainer>
  );
}

export default AddBusinessUser;
