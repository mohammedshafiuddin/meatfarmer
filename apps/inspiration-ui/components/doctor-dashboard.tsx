import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { tw , MyText } from 'common-ui';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useDoctorTodaysTokens, useHospitalTodaysTokens , useUpdateTokenStatus } from '@/api-hooks/token.api';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { DoctorTodayToken } from 'shared-types';
import DoctorTokenCard from '@/app/(drawer)/todays-tokens/DoctorTokenCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {}

const DoctorDashboard: React.FC<Props> = (props) => {
  const {} = props;
  const router = useRouter();
  const { userId } = useCurrentUserId();
  const accentColor = useThemeColor({ light: '#4f46e5', dark: '#818cf8' }, 'tint');
  
  // Fetch today's tokens for the current doctor
  const {
    data: doctorTokensData,
    isLoading: isLoadingTokens,
    isError: isTokensError,
    error: tokensError,
    refetch: refetchTokens
  } = useDoctorTodaysTokens(userId || 0);
  
  // Use the update token status hook
  const { mutate: updateTokenStatus } = useUpdateTokenStatus();
  
  // State for consultation notes
  const [consultationNotes, setConsultationNotes] = useState<Record<number, string>>({});
  
  // Find the current token (in progress)
  const currentToken = doctorTokensData?.tokens.find(
    token => token.status === 'IN_PROGRESS'
  );
  
  // Filter upcoming tokens
  const upcomingTokens = doctorTokensData?.tokens.filter(
    token => token.status === 'UPCOMING'
  ) || [];
  
  // Handle adding consultation notes
  const handleAddNotes = (tokenId: number, notes: string) => {
    setConsultationNotes(prev => ({
      ...prev,
      [tokenId]: notes
    }));
    updateTokenStatus({ tokenId, consultationNotes: notes });
  };
  
  // Handle advancing to next patient
  const handleNextPatient = () => {
    if (currentToken) {
      // Mark current token as completed
      updateTokenStatus({ 
        tokenId: currentToken.id, 
        status: 'COMPLETED'
      });
    }
    
    // Find the next upcoming token and mark it as in progress
    const nextToken = upcomingTokens[0];
    if (nextToken) {
      updateTokenStatus({ 
        tokenId: nextToken.id, 
        status: 'IN_PROGRESS'
      });
    }
    
    refetchTokens();
  };
  
  // Handle marking patient as no-show
  const handleMarkNoShow = (tokenId: number) => {
    Alert.alert(
      'Mark as No Show',
      'Are you sure you want to mark this patient as no show?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            updateTokenStatus({ 
              tokenId, 
              status: 'MISSED'
            });
            refetchTokens();
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={tw`flex-1`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4`}>
        {/* Header */}
        <View style={tw`mb-6`}>
          <MyText style={tw`text-2xl font-bold`}>Doctor Dashboard</MyText>
          <MyText style={tw`text-gray-500`}>
            {doctorTokensData?.date ? new Date(doctorTokensData.date).toLocaleDateString() : 'Today'}
          </MyText>
        </View>
        
        {/* Current Consultation Status */}
        <View style={tw`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <MyText style={tw`text-lg font-bold`}>Current Consultation</MyText>
            {doctorTokensData?.currentTokenNumber && (
              <View style={tw`bg-blue-500 px-3 py-1 rounded-full`}>
                <MyText style={tw`text-white font-bold`}>IN PROGRESS</MyText>
              </View>
            )}
          </View>
          
          {isLoadingTokens ? (
            <View style={tw`items-center py-4`}>
              <ActivityIndicator size="small" color={accentColor} />
              <MyText style={tw`mt-2 text-gray-500`}>Loading consultation status...</MyText>
            </View>
          ) : isTokensError ? (
            <View style={tw`bg-red-50 dark:bg-red-900 p-3 rounded-lg`}>
              <MyText style={tw`text-red-600 dark:text-red-200`}>
                Error loading consultation status
              </MyText>
            </View>
          ) : currentToken ? (
            <View>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={tw`bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full items-center justify-center mr-3`}>
                  <MyText style={tw`text-blue-800 dark:text-blue-200 font-bold text-lg`}>
                    {currentToken.queueNumber}
                  </MyText>
                </View>
                <View style={tw`flex-1`}>
                  <MyText style={tw`font-bold text-lg`}>{currentToken.patientName}</MyText>
                  <MyText style={tw`text-gray-600 dark:text-gray-400`}>{currentToken.patientMobile}</MyText>
                </View>
              </View>
              
              {currentToken.description && (
                <View style={tw`bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3`}>
                  <MyText style={tw`font-medium mb-1`}>Patient Description:</MyText>
                  <MyText style={tw`text-gray-700 dark:text-gray-300`}>{currentToken.description}</MyText>
                </View>
              )}
              
              <View style={tw`flex-row justify-between mt-4`}>
                <TouchableOpacity 
                  style={tw`flex-1 bg-blue-500 py-3 rounded-lg mr-2 items-center`}
                  onPress={handleNextPatient}
                >
                  <MyText style={tw`text-white font-bold`}>Next Patient</MyText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={tw`flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg ml-2 items-center`}
                  onPress={() => handleMarkNoShow(currentToken.id)}
                >
                  <MyText style={tw`text-gray-800 dark:text-gray-200 font-bold`}>No Show</MyText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={tw`items-center py-6`}>
              <Ionicons name="person-outline" size={48} color="#9ca3af" />
              <MyText style={tw`text-gray-500 mt-2 text-center`}>
                No active consultation
              </MyText>
              <MyText style={tw`text-gray-500 text-center mt-1`}>
                {doctorTokensData?.totalTokens ? `${doctorTokensData.completedTokens} of ${doctorTokensData.totalTokens} completed` : 'No tokens for today'}
              </MyText>
            </View>
          )}
        </View>
        
        {/* Today's Statistics */}
        <View style={tw`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6`}>
          <MyText style={tw`text-lg font-bold mb-3`}>Today's Statistics</MyText>
          <View style={tw`flex-row justify-between`}>
            <StatCard 
              title="Total Tokens" 
              value={doctorTokensData?.totalTokens || 0} 
              color="blue" 
            />
            <StatCard 
              title="Completed" 
              value={doctorTokensData?.completedTokens || 0} 
              color="green" 
            />
            <StatCard 
              title="Upcoming" 
              value={upcomingTokens.length || 0} 
              color="orange" 
            />
          </View>
        </View>
        
        {/* Upcoming Tokens */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <MyText style={tw`text-lg font-bold`}>Upcoming Tokens</MyText>
            <MyText style={tw`text-gray-500`}>{upcomingTokens.length} patients</MyText>
          </View>
          
          {upcomingTokens.length > 0 ? (
            <View>
              {upcomingTokens.map((token) => (
                <DoctorTokenCard 
                  key={token.id} 
                  token={token} 
                  onMarkNoShow={handleMarkNoShow}
                  onAddNotes={handleAddNotes}
                />
              ))}
            </View>
          ) : (
            <View style={tw`bg-gray-100 dark:bg-gray-800 p-6 rounded-lg items-center`}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <MyText style={tw`text-gray-500 mt-2 text-center`}>
                No more patients scheduled for today
              </MyText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'orange' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };
  
  return (
    <View style={tw`items-center flex-1 mx-1`}>
      <View style={tw`${colorClasses[color]} w-16 h-16 rounded-full items-center justify-center mb-2`}>
        <MyText style={tw`font-bold text-xl`}>{value}</MyText>
      </View>
      <MyText style={tw`text-gray-600 dark:text-gray-400 text-sm text-center`}>{title}</MyText>
    </View>
  );
};

export default DoctorDashboard;