import React from 'react';
import { View } from 'react-native';
import { MyText , tw } from "common-ui";
import { Ionicons } from '@expo/vector-icons';

// Define the types
export interface DoctorWiseCount {
  doctorName: string;
  doctorId: number;
  fee: number;
  issuedTokens: number;
  totalAmount: number;
}

export interface DayAccountData {
  doctorWiseCount: DoctorWiseCount[];
  date: string;
  totalAmount: number;
  settled: boolean;
}

interface DayAccountViewProps {
  dayData: DayAccountData;
}

const DayAccountView: React.FC<DayAccountViewProps> = ({ dayData }) => {
  return (
    <View 
      style={tw`mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700`}
    >
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white`}>
          {dayData.date}
        </MyText>
        <View style={tw`flex-row items-center`}>
          <MyText style={tw`text-lg font-bold text-gray-800 dark:text-white mr-2`}>
            ₹{dayData.totalAmount}
          </MyText>
          {dayData.settled ? (
            <View style={tw`flex-row items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full`}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <MyText style={tw`text-green-700 dark:text-green-400 ml-1 text-xs`}>Settled</MyText>
            </View>
          ) : (
            <View style={tw`flex-row items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full`}>
              <Ionicons name="alert-circle" size={16} color="#f59e0b" />
              <MyText style={tw`text-yellow-700 dark:text-yellow-400 ml-1 text-xs`}>Pending</MyText>
            </View>
          )}
        </View>
      </View>
      
      <View style={tw`mt-3`}>
        {dayData.doctorWiseCount.map((doctor, idx) => (
          <View 
            key={idx} 
            style={tw`flex-row justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-2`}
          >
            <View>
              <MyText style={tw`font-medium text-gray-800 dark:text-white`}>
                {doctor.doctorName}
              </MyText>
              <MyText style={tw`text-xs text-gray-600 dark:text-gray-400`}>
                ₹{doctor.fee} × {doctor.issuedTokens} tokens
              </MyText>
            </View>
            <MyText style={tw`font-bold text-gray-800 dark:text-white`}>
              ₹{doctor.totalAmount}
            </MyText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default DayAccountView;