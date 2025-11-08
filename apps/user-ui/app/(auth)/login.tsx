import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";

import { MyButton, MyText, MyTextInput, tw } from "common-ui";
import { useAuth } from "@/src/contexts/AuthContext";
import GoogleSignInPKCE from "@/src/components/google-sign-in";

interface LoginFormInputs {
  mobile: string;
  password: string;
}

function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);



  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormInputs>({
    defaultValues: { mobile: "", password: "" },
  });

  const validateMobile = (mobile: string): boolean => {
    // Remove all non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    // Check if it's a valid Indian mobile number (10 digits, starts with 6-9)
    return cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile);
  };

  const onSubmit = async (data: LoginFormInputs) => {
    clearErrors();

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

    setIsLoading(true);
    try {
      await login({
        identifier: data.mobile.replace(/\D/g, ''), // Clean mobile number
        password: data.password,
      });
      // Auth context will handle navigation on successful login
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid mobile number or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 justify-center px-4 bg-white`}>
      <View style={tw`mb-8 mt-4`}>
        <MyText
          weight="bold"
          style={tw`text-3xl mb-2 text-center text-gray-800`}
        >
          Welcome Back
        </MyText>
        <MyText style={tw`text-base text-center text-gray-600`}>
          Sign in to continue your journey
        </MyText>
      </View>

      <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
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
            <View style={tw`mb-4`}>
              <MyTextInput
                topLabel="Password"
                placeholder="Enter your password"
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

        <View style={tw`flex-row justify-end mb-6`}>
          <TouchableOpacity
            onPress={() => {
              // TODO: Implement forgot password
              Alert.alert('Coming Soon', 'Forgot password feature will be available soon.');
            }}
          >
            <MyText weight="semibold" style={tw`text-blue-600`}>
              Forgot Password?
            </MyText>
          </TouchableOpacity>
        </View>

        <MyButton
          onPress={handleSubmit(onSubmit)}
          fillColor="blue1"
          textColor="white1"
          fullWidth
          disabled={isLoading}
          style={tw`py-3 rounded-lg`}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </MyButton>
      </View>
      <GoogleSignInPKCE />

      <View style={tw`flex-row justify-center mt-2 mb-8`}>
        <MyText style={tw`text-base text-gray-600`}>Don't have an account? </MyText>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <MyText weight="semibold" style={tw`text-blue-600`}>
            Sign up
          </MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Login;