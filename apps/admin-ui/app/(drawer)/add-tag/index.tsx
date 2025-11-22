import React from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import TagForm from '@/src/components/TagForm';
import { useCreateTag } from '@/src/api-hooks/tag.api';

interface TagFormData {
  tagName: string;
  tagDescription: string;
  isDashboardTag: boolean;
}

export default function AddTag() {
  const router = useRouter();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();

  const handleSubmit = (values: TagFormData, image?: { uri?: string }) => {
    const formData = new FormData();

    // Add text fields
    formData.append('tagName', values.tagName);
    if (values.tagDescription) {
      formData.append('tagDescription', values.tagDescription);
    }
    formData.append('isDashboardTag', values.isDashboardTag.toString());

    // Add image if uploaded
    if (image?.uri) {
      const filename = image.uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: image.uri,
        name: filename,
        type,
      } as any);
    }

    createTag(formData, {
      onSuccess: (data) => {
        Alert.alert('Success', 'Tag created successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error: any) => {
        const errorMessage = error.message || 'Failed to create tag';
        Alert.alert('Error', errorMessage);
      },
    });
  };

  const initialValues: TagFormData = {
    tagName: '',
    tagDescription: '',
    isDashboardTag: false,
  };

  return (
    <AppContainer>
      <View style={tw`flex-1 bg-gray-50`}>

        {/* Form */}
        <TagForm
          mode="create"
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isLoading={isCreating}
        />
      </View>
    </AppContainer>
  );
}