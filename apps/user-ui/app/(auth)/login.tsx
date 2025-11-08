import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";

import { AppContainer, MyButton, MyText, MyTextInput, tw } from "common-ui";
import { useAuth } from "@/src/contexts/AuthContext";
import GoogleSignInPKCE from "@/src/components/google-sign-in";
import { trpc } from '@/src/trpc-client';

interface LoginFormInputs {
  mobile: string;
  otp?: string;
}

function Login() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtpMutation = trpc.user.auth.sendOtp.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setOtpSent(true);
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.message);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = trpc.user.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token && data.user) {
        loginWithToken(data.token, data.user);
      } else {
        Alert.alert('Error', 'Verification failed');
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Invalid OTP');
    },
  });



  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<LoginFormInputs>({
    defaultValues: { mobile: "" },
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

    const cleanMobile = data.mobile.replace(/\D/g, '');

    if (!otpSent) {
      // Send OTP
      sendOtpMutation.mutate({ mobile: cleanMobile });
    } else {
      // Verify OTP
      if (!data.otp || data.otp.length < 4) {
        setError("otp", {
          type: "manual",
          message: "Please enter a valid OTP",
        });
        return;
      }

      verifyOtpMutation.mutate({
        mobile: cleanMobile,
        otp: data.otp,
      });
    }
  };

  return (
    <AppContainer>
      <View style={tw`flex-1 justify-center`}>
      <View style={tw``}>
        <Image
          source={require('@/assets/images/farm2door-logo.png')}
          style={{
            width: 240,
            height: 240,
            alignSelf: 'center',
            marginBottom: 20,
            resizeMode: 'contain',
          }}
        />
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

        {otpSent && (
          <Controller
            control={control}
            name="otp"
            rules={{ required: "OTP is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tw`mb-4`}>
                <MyTextInput
                  topLabel="OTP"
                  placeholder="Enter 6-digit OTP"
                  value={value}
                  onChangeText={(text) => {
                    if (text.length <= 6) {
                      onChange(text);
                    }
                  }}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={6}
                  style={tw`bg-gray-50`}
                  error={!!errors.otp}
                />
              </View>
            )}
          />
        )}
        {errors.otp && (
          <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
            {errors.otp.message}
          </Text>
        )}

        {otpSent && (
          <View style={tw`flex-row justify-end mb-6`}>
            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setValue('otp', '');
                clearErrors();
              }}
            >
              <MyText weight="semibold" style={tw`text-blue-600`}>
                Change Number
              </MyText>
            </TouchableOpacity>
          </View>
        )}

        <MyButton
          onPress={handleSubmit(onSubmit)}
          fillColor="blue1"
          textColor="white1"
          fullWidth
          disabled={isLoading || sendOtpMutation.isPending || verifyOtpMutation.isPending}
          style={tw` rounded-lg`}
        >
          {isLoading || sendOtpMutation.isPending || verifyOtpMutation.isPending
            ? (otpSent ? "Verifying..." : "Processing...")
            : (otpSent ? "Verify OTP" : "Next")}
        </MyButton>
      </View>
      </View>
    </AppContainer>
  );
}

export default Login;