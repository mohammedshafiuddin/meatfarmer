import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { MyText , tw } from "common-ui";
import { Ionicons } from '@expo/vector-icons';
import DayAccountView, { DayAccountData } from '@/components/day-account-view';
import AppContainer from '@/components/app-container';

// Generate mock data for the last 12 days
const generateMockData = () => {
  const mockData: DayAccountData[] = [];
  const doctors = [
    { name: 'Dr. Smith', id: 1 },
    { name: 'Dr. Johnson', id: 2 },
    { name: 'Dr. Williams', id: 3 },
    { name: 'Dr. Brown', id: 4 },
    { name: 'Dr. Davis', id: 5 },
  ];
  
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    const doctorCount = Math.floor(Math.random() * 4) + 1; // 1-4 doctors per day
    const doctorWiseCount = [];
    
    for (let j = 0; j < doctorCount; j++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const fee = Math.floor(Math.random() * 300) + 200; // 200-500
      const issuedTokens = Math.floor(Math.random() * 15) + 5; // 5-20 tokens
      const totalAmount = fee * issuedTokens;
      
      doctorWiseCount.push({
        doctorName: doctor.name,
        doctorId: doctor.id,
        fee,
        issuedTokens,
        totalAmount,
      });
    }
    
    const totalAmount = doctorWiseCount.reduce((sum, doctor) => sum + doctor.totalAmount, 0);
    const settled = Math.random() > 0.7; // 30% chance of being settled
    
    mockData.push({
      doctorWiseCount,
      date: date.toISOString().split('T')[0],
      totalAmount,
      settled,
    });
  }
  
  return mockData;
};

export default function AccountsPage() {
  const mockData = generateMockData();

  return (
    <ThemedView style={tw`flex-1`}>
      <View style={tw`p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`}>
        <MyText style={tw`text-xl font-bold text-gray-800 dark:text-white`}>Accounts</MyText>
        <MyText style={tw`text-gray-600 dark:text-gray-400`}>Financial and accounting information</MyText>
      </View>
      
      <AppContainer>
        {mockData.map((dayData, index) => (
          <DayAccountView 
            key={index} 
            dayData={dayData} 
          />
        ))}
      </AppContainer>
    </ThemedView>
  );
}