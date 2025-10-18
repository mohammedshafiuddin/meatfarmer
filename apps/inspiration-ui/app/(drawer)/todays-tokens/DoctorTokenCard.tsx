import React, { useState } from 'react';
import { View, Alert, TextInput } from 'react-native';
import { MyText , tw } from "common-ui";
import { DoctorTodayToken } from 'common-ui/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateTokenStatus } from '@/api-hooks/token.api';
import { LinearGradient } from 'expo-linear-gradient';

interface DoctorTokenCardProps {
  token: DoctorTodayToken;
  onMarkNoShow?: (tokenId: number) => void;
  onAddNotes?: (tokenId: number, notes: string) => void;
}

const DoctorTokenCard: React.FC<DoctorTokenCardProps> = ({ token, onMarkNoShow, onAddNotes }) => {
  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'MISSED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusColorClass = getStatusColor(token.status ?? '');

  // Check for special indicators
  const isPriority = token.description?.toLowerCase().includes('urgent') || 
                    token.description?.toLowerCase().includes('emergency') ||
                    token.description?.toLowerCase().includes('asap');
  
  const isFollowUp = token.description?.toLowerCase().includes('follow-up') || 
                     token.description?.toLowerCase().includes('follow up') ||
                     token.description?.toLowerCase().includes('followup');

  // State for notes input
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesInput, setNotesInput] = useState(token.consultationNotes || '');
  
  // Use the update token status hook
  const { mutate: updateTokenStatus } = useUpdateTokenStatus();

  // Handle marking as no show
  const handleMarkNoShow = () => {
    console.log('Mark as No Show pressed for token:', token.id);
    updateTokenStatus({ 
      tokenId: token.id, 
      status: 'MISSED'
    });
  };

  // Handle adding notes
  const handleAddNotes = () => {
    setShowNotesInput(true);
  };

  // Save notes
  const saveNotes = () => {
    updateTokenStatus({ 
      tokenId: token.id, 
      consultationNotes: notesInput
    });
    setShowNotesInput(false);
  };

  // Cancel notes input
  const cancelNotes = () => {
    setNotesInput(token.consultationNotes || '');
    setShowNotesInput(false);
  };

  return (
    <View style={tw`bg-white p-5 rounded-2xl shadow-lg mb-4 border-l-4 ${
      token.status === 'COMPLETED' ? 'border-green-500' : 
      token.status === 'IN_PROGRESS' ? 'border-orange-500' : 
      token.status === 'UPCOMING' ? 'border-blue-500' : 
      token.status === 'MISSED' ? 'border-red-500' : 'border-gray-500'
    }`}>
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <MyText style={tw`text-xl font-bold text-gray-800`}>Token #{token.queueNumber}</MyText>
            {isPriority && (
              <LinearGradient 
                colors={['#ef4444', '#dc2626']} 
                style={tw`ml-3 px-3 py-1 rounded-full flex-row items-center`}
              >
                <Ionicons name="alert-circle" size={14} color="white" />
                <MyText style={tw`text-white text-xs font-bold ml-1`}>URGENT</MyText>
              </LinearGradient>
            )}
            {isFollowUp && (
              <LinearGradient 
                colors={['#8b5cf6', '#7c3aed']} 
                style={tw`ml-3 px-3 py-1 rounded-full`}
              >
                <MyText style={tw`text-white text-xs font-bold`}>FOLLOW-UP</MyText>
              </LinearGradient>
            )}
          </View>
          <MyText style={tw`text-gray-700 font-medium mt-1`}>{token.patientName}</MyText>
          <MyText style={tw`text-gray-500 text-sm`}>{token.patientMobile}</MyText>
        </View>
        <LinearGradient 
          colors={
            token.status === 'COMPLETED' ? ['#10b981', '#059669'] :
            token.status === 'IN_PROGRESS' ? ['#f97316', '#ea580c'] :
            token.status === 'UPCOMING' ? ['#3b82f6', '#2563eb'] :
            token.status === 'MISSED' ? ['#ef4444', '#dc2626'] :
            ['#6b7280', '#4b5563']
          } 
          style={tw`px-4 py-2 rounded-full`}
        >
          <MyText style={tw`text-white text-xs font-bold`}>
            {token.status ?? 'N/A'}
          </MyText>
        </LinearGradient>
      </View>
      {token.description && (
        <View style={tw`mt-3 p-3 bg-gray-50 rounded-xl`}>
          <MyText style={tw`text-gray-700 text-sm`}>
            <MyText style={tw`font-bold text-gray-800`}>Description: </MyText>
            {token.description}
          </MyText>
        </View>
      )}
      {showNotesInput ? (
        <View style={tw`mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200`}>
          <TextInput
            style={tw`border border-gray-300 rounded-xl p-3 mb-3 bg-white`}
            value={notesInput}
            onChangeText={setNotesInput}
            placeholder="Enter consultation notes"
            multiline
            numberOfLines={3}
          />
          <View style={tw`flex-row justify-end`}>
            <MyText 
              style={tw`text-gray-600 mr-6 font-medium`}
              onPress={cancelNotes}
            >
              Cancel
            </MyText>
            <MyText 
              style={tw`text-blue-600 font-bold`}
              onPress={saveNotes}
            >
              Save Notes
            </MyText>
          </View>
        </View>
      ) : token.consultationNotes ? (
        <View style={tw`mt-3 p-3 bg-blue-50 rounded-xl`}>
          <MyText style={tw`text-blue-800 text-sm`}>
            <MyText style={tw`font-bold text-blue-900`}>Notes: </MyText>
            {token.consultationNotes}
          </MyText>
        </View>
      ) : null}
      {/* Action buttons for doctors - available for all statuses */}
      <View style={tw`flex-row mt-4 pt-4 border-t border-gray-100`}>
        <View style={tw`flex-1`}>
          <MyText 
            style={tw`text-green-600 text-center font-bold py-2`}
            onPress={() => updateTokenStatus({ tokenId: token.id, status: 'COMPLETED' })}
          >
            Mark as Completed
          </MyText>
        </View>
        <View style={tw`h-6 w-px bg-gray-200 mx-2 self-center`} />
        <View style={tw`flex-1`}>
          <MyText 
            style={tw`text-red-500 text-center font-bold py-2`}
            onPress={handleMarkNoShow}
          >
            Mark as No Show
          </MyText>
        </View>
        <View style={tw`h-6 w-px bg-gray-200 mx-2 self-center`} />
        <View style={tw`flex-1`}>
          <MyText 
            style={tw`text-blue-600 text-center font-bold py-2`}
            onPress={handleAddNotes}
          >
            Add Notes
          </MyText>
        </View>
      </View>
    </View>
  );
};

export default DoctorTokenCard;
