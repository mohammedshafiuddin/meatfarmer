import React, { forwardRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, BottomDropdown, MyText, tw, ImageUploader } from 'common-ui';
import { trpc } from '../src/trpc-client';
import usePickImage from 'common-ui/src/components/use-pick-image';

export interface StoreFormData {
  name: string;
  description: string;
  imageUrl?: string;
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
  imageUrl: Yup.string(),
  owner: Yup.number().required('Owner is required'),
});

const StoreForm = forwardRef<StoreFormRef, StoreFormProps>((props, ref) => {
  const { mode, initialValues, onSubmit, isLoading } = props;
  const { data: staffData } = trpc.admin.staffUser.getStaff.useQuery();

  const [formInitialValues, setFormInitialValues] = useState<StoreFormData>(initialValues);
  const [selectedImages, setSelectedImages] = useState<{ blob: Blob; mimeType: string }[]>([]);
  const [displayImages, setDisplayImages] = useState<{ uri?: string }[]>([]);

  useEffect(() => {
    setFormInitialValues(initialValues);
  }, [initialValues]);

  const staffOptions = staffData?.staff.map(staff => ({
    label: staff.name,
    value: staff.id,
  })) || [];

  const generateUploadUrls = trpc.common.generateUploadUrls.useMutation();

  const handleImagePick = usePickImage({
    setFile: async (assets: any) => {
      if (!assets || (Array.isArray(assets) && assets.length === 0)) {
        setSelectedImages([]);
        setDisplayImages([]);
        return;
      }

      const files = Array.isArray(assets) ? assets : [assets];
      const blobPromises = files.map(async (asset) => {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        return { blob, mimeType: asset.mimeType || 'image/jpeg' };
      });

      const blobArray = await Promise.all(blobPromises);
      setSelectedImages(blobArray);
      setDisplayImages(files.map(asset => ({ uri: asset.uri })));
    },
    multiple: false, // Single image for stores
  });

  const handleRemoveImage = (uri: string) => {
    const index = displayImages.findIndex(img => img.uri === uri);
    if (index !== -1) {
      const newDisplay = displayImages.filter((_, i) => i !== index);
      const newFiles = selectedImages.filter((_, i) => i !== index);
      setDisplayImages(newDisplay);
      setSelectedImages(newFiles);
    }
  };
  
  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleSubmit, values, setFieldValue, errors, touched }) => {
        const submit = async () => {
          try {
            let imageUrl: string | undefined;

            if (selectedImages.length > 0) {
              // Generate upload URLs
              const mimeTypes = selectedImages.map(s => s.mimeType);
              const { uploadUrls } = await generateUploadUrls.mutateAsync({
                contextString: 'store',
                mimeTypes,
              });

              // Upload images
              for (let i = 0; i < uploadUrls.length; i++) {
                const uploadUrl = uploadUrls[i];
                const { blob, mimeType } = selectedImages[i];

                const uploadResponse = await fetch(uploadUrl, {
                  method: 'PUT',
                  body: blob,
                  headers: {
                    'Content-Type': mimeType,
                  },
                });

                if (!uploadResponse.ok) {
                  throw new Error(`Upload failed with status ${uploadResponse.status}`);
                }
              }

              // Extract key from first upload URL
              // const u = new URL(uploadUrls[0]);
              // const rawKey = u.pathname.replace(/^\/+/, "");
              // imageUrl = decodeURIComponent(rawKey);
              imageUrl = uploadUrls[0];
            }

            // Submit form with imageUrl
            onSubmit({ ...values, imageUrl });
          } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
          }
        };

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
            <View style={tw`mb-6`}>
              <MyText style={tw`text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider`}>Store Image</MyText>
              <ImageUploader
                images={displayImages}
                existingImageUrls={formInitialValues.imageUrl ? [formInitialValues.imageUrl] : []}
                onAddImage={handleImagePick}
                onRemoveImage={handleRemoveImage}
                onRemoveExistingImage={() => setFormInitialValues({ ...formInitialValues, imageUrl: undefined })}
                allowMultiple={false}
              />
            </View>
            <TouchableOpacity
              onPress={submit}
              disabled={isLoading || generateUploadUrls.isPending}
              style={tw`px-4 py-2 rounded-lg shadow-lg items-center mt-2 ${isLoading || generateUploadUrls.isPending ? 'bg-gray-400' : 'bg-blue-500'}`}
            >
              <MyText style={tw`text-white text-lg font-bold`}>
                {generateUploadUrls.isPending ? 'Uploading...' : isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Store' : 'Update Store')}
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