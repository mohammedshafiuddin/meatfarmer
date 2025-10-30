import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { MyText, tw } from "common-ui";
import { useAuth } from "@/src/contexts/AuthContext";
import RegistrationForm from "@/components/registration-form";

function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await register(formData);
      // Auth context will handle navigation on successful registration
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`} showsVerticalScrollIndicator={false}>
      <View style={tw`flex-1 justify-center px-4 py-8`}>
        <View style={tw`mb-8 mt-4`}>
          <MyText
            weight="bold"
            style={tw`text-3xl mb-2 text-center text-gray-800`}
          >
            Create Account
          </MyText>
          <MyText style={tw`text-base text-center text-gray-600`}>
            Join us to start your journey
          </MyText>
        </View>

        <RegistrationForm onSubmit={handleRegister} isLoading={isLoading} />

        <View style={tw`flex-row justify-center mt-2 mb-8`}>
          <MyText style={tw`text-base text-gray-600`}>Already have an account? </MyText>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <MyText weight="semibold" style={tw`text-blue-600`}>
              Sign in
            </MyText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default Register;