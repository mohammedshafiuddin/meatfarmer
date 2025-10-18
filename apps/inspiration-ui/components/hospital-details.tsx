import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MyText , tw } from "common-ui";
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

interface Specialization {
  id: number;
  name: string;
  description?: string;
}

interface Employee {
  id: number;
  name: string;
  designation: string;
}

interface HospitalDetailsProps {
  hospital: {
    id: number;
    name: string;
    address: string;
    description?: string;
    specializations?: Specialization[];
    employees?: Employee[];
    imageUrl?: string;
  };
  onPress?: () => void;
  showFullDetails?: boolean;
}

const HospitalDetails: React.FC<HospitalDetailsProps> = ({ 
  hospital, 
  onPress, 
  showFullDetails = false 
}) => {
  const backgroundColor = useThemeColor({ light: 'white', dark: '#1f2937' }, 'background');
  const textColor = useThemeColor({ light: '#333', dark: '#f3f4f6' }, 'text');
  const secondaryColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'tabIconDefault');
  
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[
        tw`rounded-xl mb-4 overflow-hidden shadow-md`,
        { backgroundColor },
        styles.container
      ]} 
      onPress={onPress}
    >
      {/* Hospital Image */}
      <View style={tw`h-32 bg-gray-200 dark:bg-gray-800`}>
        {hospital.imageUrl ? (
          <Image 
            source={{ uri: hospital.imageUrl }} 
            style={tw`w-full h-full`} 
            resizeMode="cover"
          />
        ) : (
          <View style={tw`flex-1 items-center justify-center`}>
            <Ionicons name="business" size={32} color="#9ca3af" />
          </View>
        )}
      </View>
      
      <View style={tw`p-4`}>
        <MyText style={[tw`text-xl font-bold mb-1`, { color: textColor }]}>
          {hospital.name}
        </MyText>
        
        <View style={tw`flex-row items-start mt-1`}>
          <Ionicons name="location" size={16} color={secondaryColor} style={tw`mt-0.5 mr-1`} />
          <MyText style={[tw`text-sm flex-1`, { color: secondaryColor }]}>
            {hospital.address}
          </MyText>
        </View>
        
        {hospital.specializations && hospital.specializations.length > 0 && (
          <View style={tw`flex-row flex-wrap mt-2`}>
            {hospital.specializations.slice(0, 3).map((spec) => (
              <View 
                key={spec.id} 
                style={[
                  tw`mr-2 mb-2 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900`, 
                ]}
              >
                <MyText style={tw`text-xs text-blue-700 dark:text-blue-200`}>
                  {spec.name}
                </MyText>
              </View>
            ))}
            {hospital.specializations.length > 3 && (
              <View style={tw`mr-2 mb-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800`}>
                <MyText style={tw`text-xs text-gray-600 dark:text-gray-400`}>
                  +{hospital.specializations.length - 3} more
                </MyText>
              </View>
            )}
          </View>
        )}
      </View>
      
      {showFullDetails && (
        <ThemedView style={tw`px-4 pb-4 pt-0`}>
          {hospital.description && (
            <View style={tw`mb-3`}>
              <MyText style={tw`text-sm font-medium mb-1`}>About</MyText>
              <MyText style={tw`text-sm`}>{hospital.description}</MyText>
            </View>
          )}
          
          {hospital.specializations && hospital.specializations.length > 0 && (
            <View style={tw`mb-3`}>
              <MyText style={tw`text-sm font-medium mb-1`}>Specializations</MyText>
              <View style={tw`flex-row flex-wrap`}>
                {hospital.specializations.map((spec) => (
                  <View 
                    key={spec.id} 
                    style={[
                      tw`mr-2 mb-2 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900`, 
                    ]}
                  >
                    <MyText style={tw`text-xs text-blue-700 dark:text-blue-200`}>
                      {spec.name}
                    </MyText>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {hospital.employees && hospital.employees.length > 0 && (
            <View>
              <MyText style={tw`text-sm font-medium mb-1`}>Key Staff</MyText>
              {hospital.employees.slice(0, 5).map((employee, index) => (
                <View key={employee.id || index} style={tw`flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-800`}>
                  <MyText style={tw`text-sm`}>{employee.name}</MyText>
                  <MyText style={[tw`text-sm`, { color: secondaryColor }]}>
                    {employee.designation}
                  </MyText>
                </View>
              ))}
              {hospital.employees.length > 5 && (
                <MyText style={[tw`text-sm text-right mt-2`, { color: secondaryColor }]}>
                  +{hospital.employees.length - 5} more staff
                </MyText>
              )}
            </View>
          )}
        </ThemedView>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  }
});

export default HospitalDetails;
