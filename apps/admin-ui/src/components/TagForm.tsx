import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, MyText, Checkbox, ImageUploader, tw, useFocusCallback } from 'common-ui';
import usePickImage from 'common-ui/src/components/use-pick-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface TagFormData {
  tagName: string;
  tagDescription: string;
  isDashboardTag: boolean;
}

interface TagFormProps {
  mode: 'create' | 'edit';
  initialValues: TagFormData;
  existingImageUrl?: string;
  onSubmit: (values: TagFormData, image?: { uri?: string }) => void;
  isLoading: boolean;
}

const TagForm = forwardRef<any, TagFormProps>(({
  mode,
  initialValues,
  existingImageUrl = '',
  onSubmit,
  isLoading,
}, ref) => {
  const [image, setImage] = useState<{ uri?: string } | null>(null);
  const [isDashboardTagChecked, setIsDashboardTagChecked] = useState<boolean>(Boolean(initialValues.isDashboardTag));

  // Update checkbox when initial values change
  useEffect(() => {
    setIsDashboardTagChecked(Boolean(initialValues.isDashboardTag));
    existingImageUrl && setImage({uri:existingImageUrl})
  }, [initialValues.isDashboardTag]);

  const pickImage = usePickImage({
    setFile: (files) => {
      
      setImage(files || null)
    },
    multiple: false,
  });
  
  console.log({image})
  

  const validationSchema = Yup.object().shape({
    tagName: Yup.string()
      .required('Tag name is required')
      .min(1, 'Tag name must be at least 1 character')
      .max(100, 'Tag name must be less than 100 characters'),
    tagDescription: Yup.string()
      .max(500, 'Description must be less than 500 characters'),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => onSubmit(values, image || undefined)}
      enableReinitialize
    >
      {({ handleChange, handleSubmit, values, setFieldValue, errors, touched, setFieldValue: formikSetFieldValue, resetForm }) => {
        // Clear form when screen comes into focus
        const clearForm = useCallback(() => {
          setImage(null);

          setIsDashboardTagChecked(false);
          resetForm();
        }, [resetForm]);

        useFocusCallback(clearForm);

        return (
          <View style={tw`p-4`}>
            <MyTextInput
              topLabel="Tag Name"
              placeholder="Enter tag name"
              value={values.tagName}
              onChangeText={handleChange('tagName')}
              style={{ marginBottom: 16 }}
            />

            <MyTextInput
              topLabel="Description (Optional)"
              placeholder="Enter tag description"
              multiline
              numberOfLines={3}
              value={values.tagDescription}
              onChangeText={handleChange('tagDescription')}
              style={{ marginBottom: 16 }}
            />

            {/* Image Upload Section */}
            <View style={tw`mb-6`}>
              <MyText style={tw`text-lg font-bold mb-2 text-gray-800`}>
                Tag Image {mode === 'edit' ? '(Upload new to replace)' : '(Optional)'}
              </MyText>


              <ImageUploader
                images={image ? [image] : []}
                onAddImage={pickImage}
                onRemoveImage={() => setImage(null)}
              />
            </View>

            {/* Dashboard Tag Checkbox */}
            <View style={tw`flex-row items-center mb-6`}>
              <Checkbox
                checked={isDashboardTagChecked}
                onPress={() => {
                  const newValue = !isDashboardTagChecked;
                  setIsDashboardTagChecked(newValue);
                  formikSetFieldValue('isDashboardTag', newValue);
                }}
              />
              <MyText style={tw`ml-3 text-gray-800`}>Mark as Dashboard Tag</MyText>
            </View>

            <TouchableOpacity
              onPress={() => handleSubmit()}
              disabled={isLoading}
              style={tw`px-4 py-3 rounded-lg shadow-lg items-center ${isLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
            >
              <MyText style={tw`text-white text-lg font-bold`}>
                {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Tag' : 'Update Tag')}
              </MyText>
            </TouchableOpacity>
          </View>
        );
      }}
    </Formik>
  );
});

TagForm.displayName = 'TagForm';

export default TagForm;