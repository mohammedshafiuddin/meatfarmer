import { MyText , MyButton , tw } from "common-ui";
import React from "react";
import { ScrollView, View, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useGetBusinessUsers, BusinessUser } from "@/api-hooks/user.api";
import { MaterialIcons } from '@expo/vector-icons';
import AppContainer from "@/components/app-container";

interface BusinessUserCardProps {
  user: BusinessUser;
  onViewDetails: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
}

/**
 * BusinessUserCard component to display individual business user information
 */
const BusinessUserCard: React.FC<BusinessUserCardProps> = ({ user, onViewDetails, onEdit, onDeactivate }) => {
  return (
    <View style={tw`p-5 border border-gray-200 rounded-xl mb-4 bg-white shadow-sm`}>
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3`}>
              <MaterialIcons name="person" size={24} color="#3b82f6" />
            </View>
            <View>
              <MyText style={tw`text-xl font-bold text-gray-800`}>{user.name}</MyText>
              <MyText style={tw`text-gray-600`}>@{user.username}</MyText>
            </View>
          </View>
          
          <View style={tw`mt-4 pl-15`}>
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialIcons name="work" size={18} color="#94a3b8" style={tw`mr-2`} />
              <MyText style={tw`text-gray-700`}>
                <MyText style={tw`font-semibold`}>Role: </MyText>
                <MyText style={tw`capitalize`}>{user.role.replace('_', ' ')}</MyText>
              </MyText>
            </View>
            
            {/* {user.mobile && (
              <View style={tw`flex-row items-center mb-2`}>
                <MaterialIcons name="phone" size={18} color="#94a3b8" style={tw`mr-2`} />
                <MyText style={tw`text-gray-700`}>{user.mobile}</MyText>
              </View>
            )}
            
            {user.email && (
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="email" size={18} color="#94a3b8" style={tw`mr-2`} />
                <MyText style={tw`text-gray-700`}>{user.email}</MyText>
              </View>
            )} */}
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
          textContent="Deactivate"
          onPress={onDeactivate}
          style={tw`border-red-300`}
        />
      </View>
    </View>
  );
};

function ManageBusinessUsers() {
  const router = useRouter();
  const { data: businessUsers, isLoading, isError, refetch } = useGetBusinessUsers();

  return (
    <AppContainer>
      <View style={tw`flex-1 p-4 bg-gray-50`}>
        <View style={tw`flex-col gap-6`}>
          <View style={tw`flex-col justify-between items-center mb-2 pb-4 border-b border-gray-200`}>
            <View>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="people" size={28} color="#3b82f6" style={tw`mr-2`} />
                <MyText style={tw`text-2xl font-bold text-gray-800`}>Manage Business Users</MyText>
              </View>
              <MyText style={tw`text-gray-600 mt-1`}>
                {businessUsers?.length || 0} {businessUsers?.length === 1 ? 'user' : 'users'} found
              </MyText>
            </View>
            <MyButton
              mode="contained"
              textContent="Add User"
              onPress={() => {
                router.push("/(drawer)/admin-panel/manage-business-users/add-business-user" as any);
              }}
              style={tw`bg-blue-500 mt-4`}
            />
          </View>

          {isLoading ? (
            <View style={tw`items-center py-12 bg-white rounded-xl shadow-sm`}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <MyText style={tw`mt-4 text-gray-600 font-medium`}>Loading business users...</MyText>
            </View>
          ) : isError ? (
            <View style={tw`p-8 bg-red-50 rounded-xl shadow-sm items-center`}>
              <View style={tw`w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4`}>
                <MaterialIcons name="error" size={32} color="#ef4444" />
              </View>
              <MyText style={tw`text-red-700 font-bold text-lg mb-2 text-center`}>
                Failed to load business users
              </MyText>
              <MyText style={tw`text-red-600 text-center mb-4`}>
                There was an error loading the business users
              </MyText>
              <MyButton
                mode="outlined"
                textContent="Try Again"
                onPress={() => refetch()}
                style={tw`border-red-300 mt-2`}
              />
            </View>
          ) : businessUsers && businessUsers.length > 0 ? (
            <View>
              {businessUsers.map((user) => (
                <BusinessUserCard
                  key={user.id}
                  user={user}
                  onViewDetails={() => {
                    // Navigate to user details page (to be implemented)
                    Alert.alert("View Details", `Details for user: ${user.name}`);
                  }}
                  onEdit={() => {
                    // Navigate to edit user page
                    router.push(`/(drawer)/admin-panel/manage-business-users/edit-business-user/${user.id}`);
                  }}
                  onDeactivate={() => {
                    Alert.alert(
                      "Deactivate User",
                      `Are you sure you want to deactivate ${user.name}?`,
                      [
                        {
                          text: "Cancel",
                          style: "cancel"
                        },
                        {
                          text: "Deactivate",
                          style: "destructive",
                          onPress: () => {
                            // Implement user deactivation logic
                            Alert.alert("Success", `User ${user.name} has been deactivated`);
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
                <MaterialIcons name="person-add" size={32} color="#94a3b8" />
              </View>
              <MyText style={tw`text-gray-600 text-lg mb-2 font-medium`}>No business users found</MyText>
              <MyText style={tw`text-gray-500 text-center mb-6`}>
                Get started by adding your first business user
              </MyText>
              <MyButton
                mode="contained"
                textContent="Add Your First Business User"
                onPress={() => {
                  router.push("/(drawer)/admin-panel/manage-business-users/add-business-user" as any);
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

export default ManageBusinessUsers;
