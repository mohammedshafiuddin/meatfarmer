import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";

import { MyButton, MyText, MyTextInput, tw } from "common-ui";
import { useAuth } from "@/src/contexts/AuthContext";

interface RegisterFormInputs {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterFormInputs>({
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const password = watch("password");

  const validateMobile = (mobile: string): boolean => {
    // Remove all non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    // Check if it's a valid Indian mobile number (10 digits, starts with 6-9)
    return cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (data: RegisterFormInputs) => {
    clearErrors();

    // Validate name
    if (!data.name.trim()) {
      setError("name", {
        type: "manual",
        message: "Name is required",
      });
      return;
    }

    if (data.name.trim().length < 2) {
      setError("name", {
        type: "manual",
        message: "Name must be at least 2 characters",
      });
      return;
    }

    // Validate email
    if (!data.email.trim()) {
      setError("email", {
        type: "manual",
        message: "Email is required",
      });
      return;
    }

    if (!validateEmail(data.email)) {
      setError("email", {
        type: "manual",
        message: "Please enter a valid email address",
      });
      return;
    }

    // Validate mobile number
    if (!data.mobile.trim()) {
      setError("mobile", {
        type: "manual",
        message: "Mobile number is required",
      });
      return;
    }

    if (!validateMobile(data.mobile)) {
      setError("mobile", {
        type: "manual",
        message: "Please enter a valid 10-digit mobile number",
      });
      return;
    }

    // Validate password
    if (!data.password) {
      setError("password", {
        type: "manual",
        message: "Password is required",
      });
      return;
    }

    if (data.password.length < 6) {
      setError("password", {
        type: "manual",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    // Validate confirm password
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    // Validate terms
    if (!data.termsAccepted) {
      setError("termsAccepted", {
        type: "manual",
        message: "You must accept the terms and conditions",
      });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        mobile: data.mobile.replace(/\D/g, ''), // Clean mobile number
        password: data.password,
      });
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

        <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Name is required",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-5`}>
                <MyTextInput
                  topLabel="Full Name"
                  placeholder="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={tw`bg-gray-50`}
                  error={!!errors.name}
                />
              </View>
            )}
          />
          {errors.name && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.name.message}
            </Text>
          )}

          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-5`}>
                <MyTextInput
                  topLabel="Email Address"
                  placeholder="Enter your email address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={tw`bg-gray-50`}
                  error={!!errors.email}
                />
              </View>
            )}
          />
          {errors.email && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.email.message}
            </Text>
          )}

          <Controller
            control={control}
            name="mobile"
            rules={{
              required: "Mobile number is required",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-5`}>
                <MyTextInput
                  topLabel="Mobile Number"
                  placeholder="Enter your mobile number"
                  value={value}
                  onChangeText={(text) => {
                    // Format mobile number as user types
                    const clean = text.replace(/\D/g, '');
                    if (clean.length <= 10) {
                      onChange(clean);
                    }
                  }}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={tw`bg-gray-50`}
                  error={!!errors.mobile}
                />
              </View>
            )}
          />
          {errors.mobile && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.mobile.message}
            </Text>
          )}

          <Controller
            control={control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-5`}>
                <MyTextInput
                  topLabel="Password"
                  placeholder="Create a password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  style={tw`bg-gray-50`}
                  error={!!errors.password}
                />
              </View>
            )}
          />
          {errors.password && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.password.message}
            </Text>
          )}

          <Controller
            control={control}
            name="confirmPassword"
            rules={{ required: "Please confirm your password" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-5`}>
                <MyTextInput
                  topLabel="Confirm Password"
                  placeholder="Confirm your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  style={tw`bg-gray-50`}
                  error={!!errors.confirmPassword}
                />
              </View>
            )}
          />
          {errors.confirmPassword && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.confirmPassword.message}
            </Text>
          )}

          <Controller
            control={control}
            name="termsAccepted"
            rules={{ required: "You must accept the terms and conditions" }}
            render={({ field: { onChange, value } }) => (
              <View style={tw`mb-6`}>
                <TouchableOpacity
                  style={tw`flex-row items-center`}
                  onPress={() => onChange(!value)}
                >
                  <View
                    style={tw`w-5 h-5 border-2 border-gray-300 rounded mr-3 ${
                      value ? 'bg-blue-600 border-blue-600' : 'bg-white'
                    }`}
                  >
                    {value && (
                      <Text style={tw`text-white text-xs font-bold text-center mt-0.5`}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <MyText style={tw`text-sm text-gray-600 flex-1`}>
                    I agree to the{" "}
                    <MyText weight="semibold" style={tw`text-blue-600`}>
                      Terms and Conditions
                    </MyText>{" "}
                    and{" "}
                    <MyText weight="semibold" style={tw`text-blue-600`}>
                      Privacy Policy
                    </MyText>
                  </MyText>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.termsAccepted && (
            <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
              {errors.termsAccepted.message}
            </Text>
          )}

          <MyButton
            onPress={handleSubmit(onSubmit)}
            fillColor="blue1"
            textColor="white1"
            fullWidth
            disabled={isLoading}
            style={tw`py-3 rounded-lg`}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </MyButton>
        </View>

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