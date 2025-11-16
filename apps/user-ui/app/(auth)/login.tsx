import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert, TouchableOpacity, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";

import { AppContainer, MyButton, MyText, MyTextInput, tw } from "common-ui";
import { useAuth } from "@/src/contexts/AuthContext";
import { trpc } from '@/src/trpc-client';
import { StorageServiceCasual } from 'common-ui';

interface LoginFormInputs {
  mobile: string;
  otp?: string;
  password?: string;
}

function Login() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'mobile' | 'choice' | 'otp' | 'password'>('mobile');
  const [selectedMobile, setSelectedMobile] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const intervalRef = useRef<any | null>(null);

  const loginMutation = trpc.user.auth.login.useMutation();
  // const loginMutation = useLogin();

  // Check for stored OTP timestamp on mount
  useEffect(() => {
    const checkStoredOtpTime = async () => {
      const storedTime = await StorageServiceCasual.getItem('otp_sent_time');
      if (storedTime) {
        const timeDiff = Date.now() - parseInt(storedTime);
        const remainingTime = Math.max(0, 120 - Math.floor(timeDiff / 1000));

        if (remainingTime > 0) {
          setResendCountdown(remainingTime);
          setCanResend(false);
        } else {
          setCanResend(true);
          setResendCountdown(0);
        }
      } else {
        setCanResend(true);
      }
    };

    checkStoredOtpTime();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (resendCountdown > 0) {
      // Set new interval and attach to ref
      intervalRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [resendCountdown]);

  const sendOtpMutation = trpc.user.auth.sendOtp.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        // Save the current timestamp for resend cooldown
        await StorageServiceCasual.setItem('otp_sent_time', Date.now().toString());
        setResendCountdown(120); // 2 minutes
        setCanResend(false);
        setStep('otp');
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
    defaultValues: { mobile: "", otp: "", password: "" },
  });

  const validateMobile = (mobile: string): boolean => {
    // Remove all non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    // Check if it's a valid Indian mobile number (10 digits, starts with 6-9)
    return cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile);
  };

  const onSubmit = async (data: LoginFormInputs) => {
    clearErrors();

    if (step === 'mobile') {
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
      setSelectedMobile(cleanMobile);
      setStep('choice');
    } else if (step === 'otp') {
      // Verify OTP
      if (!data.otp || data.otp.length < 4) {
        setError("otp", {
          type: "manual",
          message: "Please enter a valid OTP",
        });
        return;
      }

      verifyOtpMutation.mutate({
        mobile: selectedMobile,
        otp: data.otp,
      });
    } else if (step === 'password') {
      // Login with password
      if (!data.password || data.password.length < 6) {
        setError("password", {
          type: "manual",
          message: "Password must be at least 6 characters",
        });
        return;
      }

      try {
        const response = await loginMutation.mutateAsync({
          identifier: selectedMobile,
          password: data.password,
        });
        loginWithToken(response.data.token, response.data.user);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Login failed');
      }
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
        {step === 'mobile' && (
          <>
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
          </>
        )}

        {step === 'choice' && (
          <View style={tw`mb-6`}>
            <MyText style={tw`text-center text-gray-600 mb-4`}>
              Choose your login method for {selectedMobile}
            </MyText>
            <View style={tw`flex-row justify-between mb-4`}>
              <MyButton
                textContent="Use Password"
                onPress={() => setStep('password')}
                fillColor="gray1"
                textColor="black1"
                style={tw`flex-1 mr-2`}
              />
              <MyButton
                textContent="Use OTP"
                onPress={() => sendOtpMutation.mutate({ mobile: selectedMobile })}
                fillColor="blue1"
                textColor="white1"
                style={tw`flex-1 ml-2`}
                disabled={sendOtpMutation.isPending}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                setStep('mobile');
                setValue('mobile', '');
                clearErrors();
              }}
            >
              <MyText weight="semibold" style={tw`text-blue-600 text-center`}>
                Change Number
              </MyText>
            </TouchableOpacity>
          </View>
        )}

        {step === 'otp' && (
          <>
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
            {errors.otp && (
              <Text style={tw`text-red-500 text-sm mb-4 text-center`}>
                {errors.otp.message}
              </Text>
            )}

            <View style={tw`flex-row justify-between items-center mb-6`}>
              <TouchableOpacity
                onPress={() => {
                  setStep('choice');
                  setValue('otp', '');
                  clearErrors();
                }}
              >
                <MyText weight="semibold" style={tw`text-blue-600`}>
                  Go Back
                </MyText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendOtpMutation.mutate({ mobile: selectedMobile })}
                disabled={!canResend || sendOtpMutation.isPending}
              >
                <MyText
                  weight="semibold"
                  style={tw`${canResend && !sendOtpMutation.isPending ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {sendOtpMutation.isPending
                    ? 'Sending...'
                    : canResend
                      ? 'Resend OTP'
                      : `Resend in ${resendCountdown}s`
                  }
                </MyText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'password' && (
          <>
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
                  setStep('choice');
                  setValue('password', '');
                  clearErrors();
                }}
              >
                <MyText weight="semibold" style={tw`text-blue-600`}>
                  Go Back
                </MyText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {(step === 'mobile' || step === 'otp' || step === 'password') && (
          <MyButton
            onPress={handleSubmit(onSubmit)}
            fillColor="blue1"
            textColor="white1"
            fullWidth
            disabled={
              isLoading ||
              sendOtpMutation.isPending ||
              verifyOtpMutation.isPending ||
              loginMutation.isPending
            }
            style={tw`rounded-lg`}
          >
            {isLoading || sendOtpMutation.isPending || verifyOtpMutation.isPending || loginMutation.isPending
              ? (step === 'otp' ? "Verifying..." : step === 'password' ? "Logging in..." : "Processing...")
              : (step === 'otp' ? "Verify OTP" : step === 'password' ? "Login" : "Next")}
          </MyButton>
        )}
      </View>
      </View>
    </AppContainer>
  );
}

export default Login;