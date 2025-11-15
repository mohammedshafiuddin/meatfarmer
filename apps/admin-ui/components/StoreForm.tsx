import React, { forwardRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, BottomDropdown, MyText, tw } from 'common-ui';
import { trpc } from '../src/trpc-client';

interface StoreFormData {
  name: string;
  description: string;
  owner: number;
}

export interface StoreFormRef {
  // Add methods if needed
}

interface StoreFormProps {
  mode: 'create' | 'edit';
  initialValues: StoreFormData;
  onSubmit: (values: StoreFormData) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  owner: Yup.number().required('Owner is required'),
});

const StoreForm = forwardRef<StoreFormRef, StoreFormProps>((props, ref) => {
  const { mode, initialValues, onSubmit, isLoading } = props;
  const { data: staffData } = trpc.admin.staffUser.getStaff.useQuery();

  const staffOptions = staffData?.staff.map(staff => ({
    label: staff.name,
    value: staff.id,
  })) || [];

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleSubmit, values, setFieldValue, errors, touched }) => {
        const submit = () => handleSubmit();

        return (
          <View>
            <MyTextInput
              topLabel="Store Name"
              placeholder="Enter store name"
              value={values.name}
              onChangeText={handleChange('name')}
              error={!!(touched.name && errors.name)}
              style={{ marginBottom: 16 }}
            />
            <MyTextInput
              topLabel="Description"
              placeholder="Enter store description"
              multiline
              numberOfLines={3}
              value={values.description}
              onChangeText={handleChange('description')}
              error={!!(touched.description && errors.description)}
              style={{ marginBottom: 16 }}
            />
            <BottomDropdown
              label="Owner"
              value={values.owner}
              options={staffOptions}
              onValueChange={(value) => setFieldValue('owner', value)}
              placeholder="Select owner"
              error={!!(touched.owner && errors.owner)}
              style={{ marginBottom: 16 }}
            />
            <TouchableOpacity
              onPress={submit}
              disabled={isLoading}
              style={tw`px-4 py-2 rounded-lg shadow-lg items-center mt-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
            >
              <MyText style={tw`text-white text-lg font-bold`}>
                {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Store' : 'Update Store')}
              </MyText>
            </TouchableOpacity>
          </View>
        );
      }}
    </Formik>
  );
});

StoreForm.displayName = 'StoreForm';

export default StoreForm;