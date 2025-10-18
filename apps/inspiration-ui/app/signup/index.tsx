import { MyText , MyTextInput , MyButton , useTheme , tw } from "common-ui";
import React from "react";
import { View, Alert, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  CreateUserPayload,
  CreateUserResponse,
  useCreateUser,
} from "@/api-hooks/user.api";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import useHideDrawerHeader from "@/hooks/useHideDrawerHeader";
import Ionicons from "@expo/vector-icons/Ionicons";
import usePickImage from "@/hooks/usePickImage";
import DecorativeGraphics from "@/components/decorative-graphics";

interface Props {}

// Define validation schema using Yup
const SignupSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  mobile: Yup.string()
    .matches(/^\d{10}$/, "Mobile number should have 10 digits")
    .required("Mobile number is required"),
  address: Yup.string().required("Address is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

function Index(props: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  const [profilePic, setProfilePic] = React.useState<{ uri?: string } | null>(
    null
  );
  useHideDrawerHeader();
  const {
    mutate: createUser,
    isPending: isCreatingUser,
    error: createUserError,
  } = useCreateUser();

  const handleProfilePicUpload = usePickImage({
    setFile: setProfilePic,
    multiple: false,
  });

  const initialValues: CreateUserPayload & { confirmPassword: string } = {
    name: "",
    email: "",
    mobile: "",
    address: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      
      const { confirmPassword, ...userData } = values;
      // Convert to FormData
      const formData = new FormData();
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string);
        }
      });
      // Attach profilePic property if present
      if (profilePic && profilePic.uri) {
        formData.append('profilePic', {
          uri: profilePic.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }

      
      createUser(formData, {
        onSuccess: (data: CreateUserResponse) => {
          Alert.alert(
            "Success",
            "Account created successfully! Please login.",
            [
              {
                text: "OK",
                onPress: () => router.push("/login"),
              },
            ]
          );
        },
        onError: (error: any) => {
          
          Alert.alert(
            "Error",
            error.message || "Failed to create account. Please try again."
          );
        },
      });
    } catch (error) {
      
      console.error("Signup error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again later."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[tw`flex-1`, { backgroundColor: theme.colors.blue3 }]}
      keyboardVerticalOffset={80}
    >
      <DecorativeGraphics />
      <ScrollView contentContainerStyle={tw`p-4 flex-grow`}>
        <View style={tw`w-full max-w-[500px] self-center flex-1 justify-center`}>
          <View style={tw`mb-6 mt-2`}>
            <MyText style={tw`text-3xl mb-2 text-center font-bold`} color="blue1">
              Welcome Aboard!
            </MyText>
            <MyText style={tw`text-base text-center`} color="gray4">
              Create your account to get started
            </MyText>
          </View>

          <Formik
            initialValues={initialValues}
            validationSchema={SignupSchema}
            onSubmit={handleSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={tw`bg-white rounded-xl p-6 shadow-md mb-24`}>
                {/* Profile Pic Field */}
                <View style={tw`items-center mb-6`}>
                  <TouchableOpacity
                    onPress={handleProfilePicUpload}
                    activeOpacity={0.7}
                    style={tw`relative`}
                  >
                    {profilePic && profilePic.uri ? (
                      <View style={tw`relative`}>
                        <Image
                          source={{ uri: profilePic.uri }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: theme.colors.gray3,
                            borderWidth: 2,
                            borderColor: theme.colors.blue2,
                          }}
                          resizeMode="cover"
                        />
                        <View
                          style={tw`absolute bottom-0 right-0 bg-white rounded-full p-1 border-2 border-white`}
                        >
                          <Ionicons
                            name="pencil"
                            size={18}
                            color={theme.colors.blue1}
                          />
                        </View>
                      </View>
                    ) : (
                      <View
                        style={tw`relative items-center justify-center`}
                      >
                        <View style={{
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          backgroundColor: theme.colors.gray3,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2,
                          borderColor: theme.colors.gray2,
                        }}>
                          <Ionicons name="person" size={48} color={theme.colors.gray1} />
                        </View>
                        <View
                          style={tw`absolute bottom-0 right-0 bg-white rounded-full p-1 border-2 border-white`}
                        >
                          <Ionicons
                            name="add-circle"
                            size={24}
                            color={theme.colors.blue1}
                          />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  <MyText style={tw`mt-2 text-sm`} color="gray4">
                    Add Profile Photo
                  </MyText>
                </View>

                <View style={tw`mb-5`}>
                  <MyTextInput
                    topLabel="Full Name"
                    placeholder="Enter your full name"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    autoCapitalize="words"
                    style={tw`bg-gray-50`}
                  />
                  {touched.name && errors.name && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.name}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-5`}>
                  <MyTextInput
                    topLabel="Email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={tw`bg-gray-50`}
                  />
                  {touched.email && errors.email && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.email}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-5`}>
                  <MyTextInput
                    topLabel="Mobile Number"
                    placeholder="Enter your mobile number"
                    value={values.mobile}
                    onChangeText={handleChange("mobile")}
                    onBlur={handleBlur("mobile")}
                    keyboardType="phone-pad"
                    style={tw`bg-gray-50`}
                  />
                  {touched.mobile && errors.mobile && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.mobile}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-5`}>
                  <MyTextInput
                    topLabel="Address"
                    placeholder="Enter your address"
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                    multiline
                    numberOfLines={3}
                    style={tw`bg-gray-50`}
                  />
                  {touched.address && errors.address && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.address}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-5`}>
                  <MyTextInput
                    topLabel="Password"
                    placeholder="Create a password"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    secureTextEntry
                    style={tw`bg-gray-50`}
                  />
                  {touched.password && errors.password && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.password}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-6`}>
                  <MyTextInput
                    topLabel="Confirm Password"
                    placeholder="Confirm your password"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    secureTextEntry
                    style={tw`bg-gray-50`}
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {errors.confirmPassword}
                    </MyText>
                  )}
                </View>

                <MyButton
                  mode="contained"
                  fullWidth
                  onPress={handleSubmit as any}
                  loading={isCreatingUser}
                  disabled={isCreatingUser}
                  textContent="Create Account"
                  style={tw`mt-2 py-1 rounded-lg`}
                />
              </View>
            )}
          </Formik>

          <View style={tw`flex-row justify-center mt-6 mb-4`}>
            <MyText style={tw`text-base`} color="gray4">Already have an account? </MyText>
            <MyText
              weight="semibold"
              style={tw`text-base ml-1`}
              color="blue1"
              onPress={() => router.push("/login")}
            >
              Login
            </MyText>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default Index;