import { MyText , MyButton , tw , AppContainer } from "common-ui";
import React from "react";
import { View, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

interface Props {}

function Index(props: Props) {
  const {} = props;
  const router = useRouter();

  return (
    <AppContainer>
      <View style={tw`flex-1 p-4 bg-gray-50`}>
        <View style={tw`flex-col gap-6`}>
          <View style={tw`items-center mb-2`}>
            <View style={tw`w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4`}>
              <MaterialIcons name="admin-panel-settings" size={40} color="#3b82f6" />
            </View>
            <MyText style={tw`text-3xl font-bold text-gray-800 mb-2`}>Admin Panel</MyText>
            <MyText style={tw`text-gray-600 text-center mb-6`}>
              Manage hospitals and business users
            </MyText>
          </View>

          <View style={tw`bg-white rounded-xl shadow-sm p-5 border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4 pb-4 border-b border-gray-100`}>
              <MaterialIcons name="local-hospital" size={24} color="#3b82f6" />
              <MyText style={tw`text-xl font-bold ml-2 text-gray-800`}>Hospitals</MyText>
            </View>
            <MyText style={tw`text-gray-600 mb-4`}>
              Create, edit, and manage hospitals in the system
            </MyText>
            <MyButton
              mode="contained"
              textContent="Manage Hospitals"
              onPress={() => {
                router.push("/(drawer)/admin-panel/manage-hospitals" as any);
              }}
              style={tw`mt-2 bg-blue-500`}
            />
          </View>

          <View style={tw`bg-white rounded-xl shadow-sm p-5 border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4 pb-4 border-b border-gray-100`}>
              <MaterialIcons name="people" size={24} color="#3b82f6" />
              <MyText style={tw`text-xl font-bold ml-2 text-gray-800`}>Business Users</MyText>
            </View>
            <MyText style={tw`text-gray-600 mb-4`}>
              Add, edit, and manage business users and their roles
            </MyText>
            <MyButton
              mode="contained"
              textContent="Manage Business Users"
              onPress={() => {
                router.push("/(drawer)/admin-panel/manage-business-users" as any);
              }}
              style={tw`mt-2 bg-blue-500`}
            />
          </View>
        </View>
      </View>
    </AppContainer>
  );
}

export default Index;
