import React from 'react';
import { View } from 'react-native';
import { MyText, tw } from 'common-ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

// Assuming a Token type, can be imported from a shared location
interface Token {
  id: any;
  queueNum: number;
  patientName: string;
  doctorName: string;
  tokenDate: string;
  status: string;
  [key: string]: any;
}

interface TokenHistoryCardProps {
  token: Token;
}

const statusStyles: { [key: string]: { gradient: string[], border: string, icon: keyof typeof Ionicons.glyphMap } } = {
  COMPLETED: { gradient: ['#10b981', '#059669'], border: 'border-green-500', icon: 'checkmark-circle' },
  IN_PROGRESS: { gradient: ['#f97316', '#ea580c'], border: 'border-orange-500', icon: 'hourglass' },
  UPCOMING: { gradient: ['#3b82f6', '#2563eb'], border: 'border-blue-500', icon: 'time' },
  MISSED: { gradient: ['#ef4444', '#dc2626'], border: 'border-red-500', icon: 'close-circle' },
  CANCELLED: { gradient: ['#6b7280', '#4b5563'], border: 'border-gray-500', icon: 'remove-circle' },
  DEFAULT: { gradient: ['#6b7280', '#4b5563'], border: 'border-gray-500', icon: 'help-circle' },
};

const TokenHistoryCard: React.FC<TokenHistoryCardProps> = ({ token }) => {
  const styles = statusStyles[token.status] || statusStyles.DEFAULT;

  return (
    <View style={tw`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md mb-4 border-l-4 ${styles.border}`}>
      {/* Header: Patient Name and Status */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white flex-1`}>{token.patientName}</MyText>
        <LinearGradient
          colors={styles.gradient}
          style={tw`px-3 py-1.5 rounded-full flex-row items-center`}
        >
          <Ionicons name={styles.icon} size={12} color="white" />
          <MyText style={tw`text-white text-xs font-bold ml-1.5`}>{token.status}</MyText>
        </LinearGradient>
      </View>

      {/* Body: Doctor and Date/Queue Info */}
      <View style={tw`border-t border-gray-100 dark:border-gray-700 pt-3`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Ionicons name="medkit-outline" size={16} color={tw.color('gray-500')} style={tw`mr-2`} />
          <MyText style={tw`text-base text-gray-700 dark:text-gray-300`}>{token.doctorName}</MyText>
        </View>
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="calendar-outline" size={16} color={tw.color('gray-500')} style={tw`mr-2`} />
            <MyText style={tw`text-sm text-gray-600 dark:text-gray-400`}>{dayjs(token.tokenDate).format('DD MMM, YYYY')}</MyText>
          </View>
          <View style={tw`flex-row items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md`}>
            <MyText style={tw`text-sm font-bold text-gray-800 dark:text-gray-200`}>Q.No: {token.queueNum}</MyText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TokenHistoryCard;