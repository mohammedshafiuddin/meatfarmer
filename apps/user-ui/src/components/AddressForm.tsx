import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as Location from 'expo-location';
import { tw } from 'common-ui';
import { Checkbox } from 'common-ui';
import { MyTextInput } from 'common-ui';
import axios from 'common-ui/src/services/axios';
import { trpc } from '../trpc-client';

interface AddressFormProps {
  onSuccess: () => void;
  initialValues?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  };
  isEdit?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSuccess, initialValues, isEdit = false }) => {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const createAddressMutation = trpc.user.address.createAddress.useMutation();

  const attachCurrentLocation = async (setFieldValue: (field: string, value: any) => void) => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Location Permission denied');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Populate form fields with geocoded data
      if (address[0]) {
        const addr = address[0];
        const addressLine1 = `${addr.streetNumber || ''} ${addr.street || ''}`.trim();
        setFieldValue('addressLine1', addressLine1 || addr.name || '');
        setFieldValue('city', addr.city || addr.subregion || '');
        setFieldValue('state', addr.region || '');
        setFieldValue('pincode', addr.postalCode || '');
      } else {
        setLocationError('Unable to determine address from your location');
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Unable to fetch location. Please check your GPS settings.');
    } finally {
      setLocationLoading(false);
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    phone: Yup.string().required('Phone is required').matches(/^\d{10}$/, 'Phone must be 10 digits'),
    addressLine1: Yup.string().required('Address Line 1 is required'),
    addressLine2: Yup.string(),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    isDefault: Yup.boolean(),
  });

  return (
    <ScrollView style={tw`p-4`}>
      <Text style={tw`text-xl font-bold mb-4`}>{isEdit ? 'Edit Address' : 'Add Address'}</Text>
      <Formik
        initialValues={initialValues || {
          name: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false,
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          createAddressMutation.mutate(values);
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={tw`flex-col gap-2`}>
            <MyTextInput
              placeholder="Name"
              shrunkPadding={true}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              value={values.name}
            />
            {touched.name && errors.name && <Text style={tw`text-red-500 mb-2`}>{errors.name}</Text>}

            <MyTextInput
              placeholder="Phone"
              shrunkPadding={true}
              keyboardType="phone-pad"
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              value={values.phone}
            />
            {touched.phone && errors.phone && <Text style={tw`text-red-500 mb-2`}>{errors.phone}</Text>}

            <MyTextInput
              placeholder="Address Line 1"
              shrunkPadding={true}
              onChangeText={handleChange('addressLine1')}
              onBlur={handleBlur('addressLine1')}
              value={values.addressLine1}
            />
            {touched.addressLine1 && errors.addressLine1 && <Text style={tw`text-red-500 mb-2`}>{errors.addressLine1}</Text>}

            <MyTextInput
              placeholder="Address Line 2 (Optional)"
              shrunkPadding={true}
              onChangeText={handleChange('addressLine2')}
              onBlur={handleBlur('addressLine2')}
              value={values.addressLine2}
            />

            <MyTextInput
              placeholder="City"
              shrunkPadding={true}
              onChangeText={handleChange('city')}
              onBlur={handleBlur('city')}
              value={values.city}
            />
            {touched.city && errors.city && <Text style={tw`text-red-500 mb-2`}>{errors.city}</Text>}

            <MyTextInput
              placeholder="State"
              shrunkPadding={true}
              onChangeText={handleChange('state')}
              onBlur={handleBlur('state')}
              value={values.state}
            />
            {touched.state && errors.state && <Text style={tw`text-red-500 mb-2`}>{errors.state}</Text>}

            <MyTextInput
              placeholder="Pincode"
              shrunkPadding={true}
              keyboardType="numeric"
              onChangeText={handleChange('pincode')}
              onBlur={handleBlur('pincode')}
              value={values.pincode}
            />
            {touched.pincode && errors.pincode && <Text style={tw`text-red-500 mb-2`}>{errors.pincode}</Text>}

            <View style={tw`flex-row items-center mb-4`}>
              <Checkbox
                checked={values.isDefault}
                onPress={() => setFieldValue('isDefault', !values.isDefault)}
              />
              <Text style={tw`ml-2`}>Set as default address</Text>
            </View>

            <TouchableOpacity
              style={tw`bg-indigo-600 p-3 rounded ${createAddressMutation.isPending ? 'opacity-50' : ''}`}
              onPress={() => handleSubmit()}
              disabled={createAddressMutation.isPending}
            >
              <Text style={tw`text-white text-center font-bold`}>
                {createAddressMutation.isPending ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Address' : 'Add Address')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default AddressForm;