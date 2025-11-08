import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";

import { MyButton, MyText, MyTextInput, ProfileImage, tw, BottomDialog } from "common-ui";
import { trpc } from "@/src/trpc-client";

interface RegisterFormInputs {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  profileImageUri?: string;
}

interface RegistrationFormProps {
  onSubmit: (data: FormData) => void | Promise<void>;
  isLoading?: boolean;
  initialValues?: Partial<RegisterFormInputs>;
  isEdit?: boolean;
}

function RegistrationForm({ onSubmit, isLoading = false, initialValues, isEdit = false }: RegistrationFormProps) {
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>();
  const [profileImageFile, setProfileImageFile] = useState<any>();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const updatePasswordMutation = trpc.user.auth.updatePassword.useMutation();

  // Set initial profile image URI for edit mode
  React.useEffect(() => {
    if (isEdit && initialValues?.profileImageUri) {
      setProfileImageUri(initialValues.profileImageUri);
    }
  }, [isEdit, initialValues?.profileImageUri]);

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
      ...initialValues,
    },
  });



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

  const handleFormSubmit = async (data: RegisterFormInputs) => {
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

    // Validate password (only in registration mode)
    if (!isEdit) {
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
    }

    // Validate terms (only in registration mode)
    if (!isEdit && !data.termsAccepted) {
      setError("termsAccepted", {
        type: "manual",
        message: "You must accept the terms and conditions",
      });
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('name', data.name.trim());
    formData.append('email', data.email.trim().toLowerCase());
    formData.append('mobile', data.mobile.replace(/\D/g, ''));

    // Only include password if provided (for edit mode)
    if (data.password) {
      formData.append('password', data.password);
    }

    if (profileImageFile) {
      
      formData.append('profileImage', {
        uri: profileImageFile.uri,
        type: profileImageFile.mimeType || 'image/jpeg',
        name: profileImageFile.name || 'profile.jpg',
      } as any);
    }

    await onSubmit(formData);
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({ password });
      Alert.alert('Success', 'Password updated successfully');
      setIsPasswordDialogOpen(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  return (
    <>
      <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
      <View style={tw`items-center mb-6`}>
        <ProfileImage
          imageUri={profileImageUri}
          onImageSelect={(uri, file) => {
            setProfileImageUri(uri);
            setProfileImageFile(file);
          }}
          size={100}
          editable={true}
        />
      </View>
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

       {!isEdit && (
         <>
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
         </>
       )}

        <MyButton
          onPress={handleSubmit(handleFormSubmit)}
          fillColor="blue1"
          textColor="white1"
          fullWidth
          disabled={isLoading}
          style={tw` rounded-lg`}
        >
          {isLoading ? (isEdit ? "Updating..." : "Creating Account...") : (isEdit ? "Update Profile" : "Create Account")}
        </MyButton>

        {isEdit && (
          <View style={tw`mt-4`}>
            <MyButton
              textContent="Update Password"
              onPress={() => setIsPasswordDialogOpen(true)}
              fillColor="blue1"
              textColor="white1"
              fullWidth
            />
          </View>
        )}
      </View>

      {isEdit && (
        <BottomDialog open={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)}>
          <View style={{ padding: 20 }}>
            <MyText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Update Password
            </MyText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
                fontSize: 16,
              }}
              placeholder="New Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 20,
                fontSize: 16,
              }}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <MyButton
                textContent="Cancel"
                onPress={() => setIsPasswordDialogOpen(false)}
                fillColor="gray1"
                textColor="white1"
              />
              <MyButton
                textContent="Update"
                onPress={handleUpdatePassword}
                fillColor="blue1"
                textColor="white1"
                disabled={updatePasswordMutation.isPending}
              />
            </View>
          </View>
        </BottomDialog>
      )}
    </>
  );
}

export default RegistrationForm;