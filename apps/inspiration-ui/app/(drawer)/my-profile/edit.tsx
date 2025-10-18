import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MyText , tw } from "common-ui";
import { useRouter } from 'expo-router';
import { useGetUserById, useUpdateBusinessUser } from '@/api-hooks/user.api';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { ThemedView } from '@/components/ThemedView';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { TextInput } from 'react-native-gesture-handler';
import usePickImage from '@/hooks/usePickImage';

interface FormValues {
  name: string;
  email: string;
  mobile: string;
  address: string;
  profilePicUrl: string;
}

export default function EditProfile() {
  const router = useRouter();
  const { userId } = useCurrentUserId();
  
  const { data: user, isLoading, isError, refetch } = useGetUserById(userId || 0);
  const { mutate: updateBusinessUser, isPending: isUpdating } = useUpdateBusinessUser(userId || 0);
  
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  // Use the image picker hook
  const pickImage = usePickImage({
    setFile: setSelectedImage,
    multiple: false
  });
  
  // Validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    mobile: Yup.string().required('Mobile number is required'),
    address: Yup.string(),
    profilePicUrl: Yup.string().url('Invalid URL'),
  });
  
  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    if (!userId) return;
    
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Append only fields that have values
      Object.entries(values).forEach(([key, value]) => {
        // Skip undefined/null values
        if (value !== undefined && value !== null) {
          // For strings, only append non-empty values (except address which can be empty)
          if (typeof value === 'string') {
            if (key === 'address' || value.trim() !== '') {
              formData.append(key, value);
            }
          } else {
            // For non-string values, append them
            formData.append(key, value);
          }
        }
      });
      
      // Handle image upload
      // if (false) {
      if (selectedImage) {

        formData.append('profilePic', {
          uri: selectedImage.uri,
          type: selectedImage.mimeType || 'image/*',
          name: selectedImage.fileName || `profile_${Date.now()}.jpg`,
        } as any);
      }

      console.log({image: formData.get('profilePic'), selectedImage});
      
      
      updateBusinessUser(
        formData,
        {
          onSuccess: () => {
            Alert.alert('Success', 'Profile updated successfully', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
          onError: (error: any) => {
            // console.log({error: JSON.stringify(error)});
            
            Alert.alert('Error', error.message || 'Failed to update profile');
          }
        }
      );
    } catch (error: any) {
      console.log({error});
      
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };
  
  // Handle profile picture change
  const handleChangeProfilePic = () => {
    pickImage();
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
      keyboardVerticalOffset={80}
    >
      <ThemedView style={tw`flex-1 bg-gray-50 dark:bg-gray-900`}>
        <Formik
          initialValues={{
            name: user?.name || '',
            email: user?.email || '',
            mobile: user?.mobile || '',
            address: user?.address || '',
            profilePicUrl: user?.profilePicUrl || '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, errors, touched, handleSubmit, setFieldValue }: FormikProps<FormValues>) => (
            <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
              {/* Header */}
              <View style={tw`bg-white dark:bg-gray-800 pt-12 pb-6 px-4`}>
                <View style={tw`flex-row items-center justify-between mb-6`}>
                  <TouchableOpacity 
                    style={tw`p-2`}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-back" size={24} color="#6b7280" />
                  </TouchableOpacity>
                  <MyText style={tw`text-xl font-bold text-gray-800 dark:text-white`}>Edit Profile</MyText>
                  <TouchableOpacity 
                    style={tw`px-4 py-2`}
                    onPress={handleSubmit as any}
                    disabled={isUpdating}
                  >
                    <MyText style={tw`text-blue-500 font-medium`}>
                      {isUpdating ? 'Saving...' : 'Save'}
                    </MyText>
                  </TouchableOpacity>
                </View>
                
                {/* Profile Picture Section */}
                <View style={tw`items-center mb-6`}>
                  <TouchableOpacity 
                    style={tw`relative`}
                    onPress={handleChangeProfilePic}
                  >
                    {selectedImage?.uri || values.profilePicUrl ? (
                      <Image
                        style={tw`h-24 w-24 rounded-full border-4 border-white dark:border-gray-800`}
                        source={{
                          uri: selectedImage?.uri || values.profilePicUrl,
                        }}
                      />
                    ) : (
                      <View style={tw`h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center border-4 border-white dark:border-gray-800`}>
                        <Ionicons name="person" size={32} color="#9ca3af" />
                      </View>
                    )}
                    <View style={tw`absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-2 border-2 border-blue-500`}>
                      <Ionicons name="camera" size={16} color="#3b82f6" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={tw`mt-2`}
                    onPress={handleChangeProfilePic}
                  >
                    <MyText style={tw`text-blue-500`}>
                      {selectedImage?.uri || values.profilePicUrl ? 'Change Photo' : 'Add Photo'}
                    </MyText>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Form Section */}
              <View style={tw`px-4 mt-6`}>
                {isLoading && (
                  <View style={tw`items-center py-8`}>
                    <MyText>Loading profile data...</MyText>
                  </View>
                )}
                
                {isError && (
                  <View style={tw`bg-red-50 dark:bg-red-900 p-4 rounded-lg mb-6`}>
                    <MyText style={tw`text-red-600 dark:text-red-200 text-center`}>
                      Error loading profile data. Please try again.
                    </MyText>
                    <TouchableOpacity 
                      style={tw`mt-2 bg-blue-500 px-4 py-2 rounded-lg self-center`}
                      onPress={() => refetch()}
                    >
                      <MyText style={tw`text-white`}>Retry</MyText>
                    </TouchableOpacity>
                  </View>
                )}
                
                {user && (
                  <View style={tw`bg-white dark:bg-gray-800 rounded-2xl shadow p-4`}>
                    {/* Name Field */}
                    <View style={tw`mb-4`}>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 mb-1`}>Full Name</MyText>
                      <View style={tw`flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3`}>
                        <Ionicons name="person" size={20} color="#6b7280" style={tw`mr-2`} />
                        <TextInput
                          style={tw`flex-1 py-3 text-gray-800 dark:text-white`}
                          value={values.name}
                          onChangeText={handleChange('name')}
                          placeholder="Enter your full name"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      {touched.name && errors.name && (
                        <MyText style={tw`text-red-500 text-sm mt-1`}>{errors.name}</MyText>
                      )}
                    </View>
                    
                    {/* Email Field */}
                    <View style={tw`mb-4`}>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 mb-1`}>Email</MyText>
                      <View style={tw`flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3`}>
                        <Ionicons name="mail" size={20} color="#6b7280" style={tw`mr-2`} />
                        <TextInput
                          style={tw`flex-1 py-3 text-gray-800 dark:text-white`}
                          value={values.email}
                          onChangeText={handleChange('email')}
                          placeholder="Enter your email"
                          placeholderTextColor="#9ca3af"
                          keyboardType="email-address"
                        />
                      </View>
                      {touched.email && errors.email && (
                        <MyText style={tw`text-red-500 text-sm mt-1`}>{errors.email}</MyText>
                      )}
                    </View>
                    
                    {/* Mobile Field */}
                    <View style={tw`mb-4`}>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 mb-1`}>Mobile</MyText>
                      <View style={tw`flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3`}>
                        <Ionicons name="call" size={20} color="#6b7280" style={tw`mr-2`} />
                        <TextInput
                          style={tw`flex-1 py-3 text-gray-800 dark:text-white`}
                          value={values.mobile}
                          onChangeText={handleChange('mobile')}
                          placeholder="Enter your mobile number"
                          placeholderTextColor="#9ca3af"
                          keyboardType="phone-pad"
                        />
                      </View>
                      {touched.mobile && errors.mobile && (
                        <MyText style={tw`text-red-500 text-sm mt-1`}>{errors.mobile}</MyText>
                      )}
                    </View>
                    
                    {/* Address Field */}
                    <View style={tw`mb-4`}>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 mb-1`}>Address</MyText>
                      <View style={tw`flex-row items-start bg-gray-50 dark:bg-gray-700 rounded-lg px-3`}>
                        <Ionicons name="location" size={20} color="#6b7280" style={tw`mr-2 mt-3`} />
                        <TextInput
                          style={tw`flex-1 py-3 text-gray-800 dark:text-white min-h-[80px]`}
                          value={values.address}
                          onChangeText={handleChange('address')}
                          placeholder="Enter your address"
                          placeholderTextColor="#9ca3af"
                          multiline
                        />
                      </View>
                      {touched.address && errors.address && (
                        <MyText style={tw`text-red-500 text-sm mt-1`}>{errors.address}</MyText>
                      )}
                    </View>
                    
                    {/* User ID (Read-only) */}
                    <View style={tw`mb-2`}>
                      <MyText style={tw`text-gray-500 dark:text-gray-400 mb-1`}>User ID</MyText>
                      <View style={tw`flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-3`}>
                        <Ionicons name="id-card" size={20} color="#6b7280" style={tw`mr-2`} />
                        <MyText style={tw`text-gray-800 dark:text-white`}>{user.id}</MyText>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Delete Account Section */}
              <View style={tw`px-4 mt-6`}>
                <View style={tw`bg-white dark:bg-gray-800 rounded-2xl shadow p-4`}>
                  <TouchableOpacity 
                    style={tw`flex-row items-center p-3`}
                    onPress={() => Alert.alert(
                      'Delete Account',
                      'Are you sure you want to delete your account? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive' }
                      ]
                    )}
                  >
                    <View style={tw`bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-3`}>
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </View>
                    <MyText style={tw`text-red-600 dark:text-red-400 flex-1`}>Delete Account</MyText>
                    <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </Formik>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}