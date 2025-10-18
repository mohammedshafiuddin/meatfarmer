import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { tw , MyText , MyTextInput , MyButton , CustomDropdown, DropdownOption , MultiSelectDropdown } from 'common-ui';
import { useRoles } from '@/components/context/roles-context';
import { useGetPotentialHospitalAdmins, PotentialHospitalAdmin } from '@/api-hooks/hospital.api';
import { useGetUnassignedDoctors, useAddDoctorsToHospital, useRemoveDoctorFromHospital } from '@/api-hooks/doctor.api';
import { Doctor } from 'shared-types';

// Define validation schema using Yup
const HospitalSchema = Yup.object().shape({
  name: Yup.string()
    .required('Hospital name is required'),
  description: Yup.string(),
  address: Yup.string()
    .required('Hospital address is required'),
  adminId: Yup.number()
    .nullable(),
  doctorIds: Yup.string()
});

// Initial form values
export const initialHospitalValues = {
  id: undefined as number | undefined,
  name: '',
  description: '',
  address: '',
  adminId: null as number | null,
  adminName: '', // For display purposes only
  adminRoles: [] as string[], // Store the admin's roles
  doctorIds: ''
};

interface HospitalDetailsFormProps {
  initialValues?: typeof initialHospitalValues;
  onSubmit: (values: typeof initialHospitalValues, { setSubmitting }: any) => Promise<void>;
  onCancel: () => void;
  submitButtonText?: string;
  isEdit?: boolean;
}

function HospitalDetailsForm({
  initialValues = initialHospitalValues,
  onSubmit,
  onCancel,
  submitButtonText = 'Add Hospital',
  isEdit = false
}: HospitalDetailsFormProps) {
  const roles = useRoles();
  const isAdmin = roles?.includes('admin');
  const { data: potentialAdmins, isLoading: isLoadingAdmins } = useGetPotentialHospitalAdmins();
  const { data: unassignedDoctors, isLoading: isLoadingDoctors } = useGetUnassignedDoctors();
  
  const addDoctorsMutation = useAddDoctorsToHospital();
  const removeDoctorMutation = useRemoveDoctorFromHospital();
  
  // Transform potential admins data to dropdown options
  const adminOptions = potentialAdmins ? potentialAdmins.map(admin => ({
    label: `${admin.name} (${admin.username}) - ${admin.roles?.join(', ')}`,
    value: admin.id
  })) : [];

  // Add an empty option for clearing selection
  const dropdownOptions = [
    { label: 'Select Hospital Admin', value: '' },
    ...adminOptions
  ];

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={HospitalSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
        <View>
          <View style={tw`mb-4`}>
            <MyTextInput
              topLabel="Hospital Name"
              placeholder="Enter hospital name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              style={tw`mb-2`}
            />
            {touched.name && errors.name && (
              <MyText style={tw`text-red-500 text-xs mt-1`}>{errors.name}</MyText>
            )}
          </View>
          
          <View style={tw`mb-4`}>
            <MyTextInput
              topLabel="Description"
              placeholder="Enter hospital description"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              multiline
              numberOfLines={4}
              style={tw`mb-2`}
            />
            {touched.description && errors.description && (
              <MyText style={tw`text-red-500 text-xs mt-1`}>{errors.description}</MyText>
            )}
          </View>
          
          <View style={tw`mb-4`}>
            <MyTextInput
              topLabel="Address"
              placeholder="Enter hospital address"
              value={values.address}
              onChangeText={handleChange('address')}
              onBlur={handleBlur('address')}
              multiline
              numberOfLines={3}
              style={tw`mb-2`}
            />
            {touched.address && errors.address && (
              <MyText style={tw`text-red-500 text-xs mt-1`}>{errors.address}</MyText>
            )}
          </View>
          
          {/* Hospital Admin Dropdown (Only visible for admin users) */}
          {isAdmin && (
            <View style={tw`mb-4`}>
              <MyText style={tw`mb-2 font-medium`}>Hospital Admin</MyText>
              {isLoadingAdmins ? (
                <MyText style={tw`p-3 border border-gray-300 rounded-lg`}>Loading administrators...</MyText>
              ) : (
                <CustomDropdown
                  label="Hospital Admin"
                  placeholder="Select Hospital Admin"
                  value={values.adminId || ''}
                  options={dropdownOptions}
                  onValueChange={(value) => {
                    const selectedValue = value.toString();
                    if (selectedValue === '') {
                      // Clear selection
                      setFieldValue('adminId', null);
                      setFieldValue('adminName', '');
                      setFieldValue('adminRoles', []); // Clear roles
                    } else {
                      // Set selection
                      const adminId = Number(value);
                      const selectedAdmin = potentialAdmins?.find(admin => admin.id === adminId);
                      if (selectedAdmin) {
                        setFieldValue('adminId', adminId);
                        setFieldValue('adminName', selectedAdmin.name);
                        setFieldValue('adminRoles', selectedAdmin.roles || []); // Store the roles
                      }
                    }
                  }}
                  error={touched.adminId && !!errors.adminId}
                />
              )}
              {touched.adminId && errors.adminId && (
                <MyText style={tw`text-red-500 text-xs mt-1`}>{errors.adminId as string}</MyText>
              )}
            </View>
          )}

          <View style={tw`mb-4`}>
            <MyText style={tw`mb-2`}>Doctors</MyText>
            <MultiSelectDropdown
              placeholder={isLoadingDoctors ? "Loading doctors..." : "Select Doctors"}
              value={values.doctorIds ? values.doctorIds.split(",") : []}
              data={unassignedDoctors?.map((doc: Doctor) => ({
                label: `${doc.name} (${doc.username})`,
                value: doc.id.toString()
              })) || []}
              onChange={(vals: string[]) => {
                const newDoctorIds = Array.isArray(vals) ? vals.join(",") : "";
                setFieldValue("doctorIds", newDoctorIds);
                
                if (isEdit && typeof values.id === 'number') {
                  const hospitalId = values.id;
                  // Get removed doctor IDs
                  const oldDoctorIds = values.doctorIds ? values.doctorIds.split(",") : [];
                  const removedDoctorIds = oldDoctorIds.filter(id => !vals.includes(id));
                  
                  // Get added doctor IDs
                  const addedDoctorIds = vals.filter(id => !oldDoctorIds.includes(id));

                  // Remove doctors that were unselected
                  removedDoctorIds.forEach(doctorId => {
                    removeDoctorMutation.mutate({
                      hospitalId,
                      doctorId: parseInt(doctorId)
                    });
                  });

                  // Add newly selected doctors
                  if (addedDoctorIds.length > 0) {
                    addDoctorsMutation.mutate({
                      hospitalId,
                      doctorIds: addedDoctorIds.map(id => parseInt(id))
                    });
                  }
                }
              }}
              disabled={isLoadingDoctors}
              style={tw`mb-2`}
            />
            {(addDoctorsMutation.isError || removeDoctorMutation.isError) && (
              <MyText style={tw`text-red-500 text-xs mt-1`}>
                Error updating doctors. Please try again.
              </MyText>
            )}
          </View>
          
          <View style={tw`flex-row justify-between mt-4`}>
            <MyButton
              mode="outlined"
              textContent="Cancel"
              onPress={onCancel}
              style={tw`flex-1 mr-2`}
            />
            
            <MyButton
              mode="contained"
              textContent={isSubmitting ? (isEdit ? "Updating..." : "Adding...") : submitButtonText}
              onPress={handleSubmit as any}
              disabled={isSubmitting}
              style={tw`flex-1 ml-2`}
            />
          </View>
        </View>
      )}
    </Formik>
  );
}

export default HospitalDetailsForm;
