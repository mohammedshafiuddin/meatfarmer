import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { tw } from 'common-ui';
import { Checkbox } from 'common-ui';
import { MyTextInput } from 'common-ui';
import axios from 'common-ui/src/services/axios';

interface AddressFormProps {
  onSuccess: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSuccess }) => {
  const createAddressMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post('/uv/address', values);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Address added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add address');
    },
  });

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
      <Text style={tw`text-xl font-bold mb-4`}>Add Address</Text>
      <Formik
        initialValues={{
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
                {createAddressMutation.isPending ? 'Adding...' : 'Add Address'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default AddressForm;