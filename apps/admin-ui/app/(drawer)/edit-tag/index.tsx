import React from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppContainer, MyText, tw } from 'common-ui';
import TagForm from '@/src/components/TagForm';
import { useGetTag, useUpdateTag } from '@/src/api-hooks/tag.api';

interface TagFormData {
  tagName: string;
  tagDescription: string;
  isDashboardTag: boolean;
  existingImageUrl?: string;
}

export default function EditTag() {
  const router = useRouter();
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const tagIdNum = tagId ? parseInt(tagId) : null;

  const { data: tagData, isLoading: isLoadingTag, error: tagError } = useGetTag(tagIdNum!);
  const { mutate: updateTag, isPending: isUpdating } = useUpdateTag();

  const handleSubmit = (values: TagFormData, image?: { uri?: string }) => {
    if (!tagIdNum) return;

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

    updateTag({ id: tagIdNum, formData }, {
      onSuccess: (data) => {
        Alert.alert('Success', 'Tag updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error: any) => {
        const errorMessage = error.message || 'Failed to update tag';
        Alert.alert('Error', errorMessage);
      },
    });
  };

  if (isLoadingTag) {
    return (
      <AppContainer>
        <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
          <MyText style={tw`text-gray-500`}>Loading tag...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (tagError || !tagData?.tag) {
    return (
      <AppContainer>
        <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
          <MyText style={tw`text-gray-500`}>Tag not found</MyText>
        </View>
      </AppContainer>
    );
  }

  const tag = tagData.tag;
  const initialValues: TagFormData = {
    tagName: tag.tagName,
    tagDescription: tag.tagDescription || '',
    isDashboardTag: tag.isDashboardTag,
    existingImageUrl: tag.imageUrl || undefined,
  };

  return (
    <AppContainer>
      <View style={tw`flex-1 bg-gray-50`}>

        {/* Form */}
        <TagForm
          mode="edit"
          initialValues={initialValues}
          existingImageUrl={tag.imageUrl || undefined}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
        />
      </View>
    </AppContainer>
  );
}