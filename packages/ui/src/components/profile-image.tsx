import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import usePickImage from './use-pick-image';
import tw from '../lib/tailwind';
import { theme } from '../theme';

interface ProfileImageProps {
  imageUri?: string;
  onImageSelect?: (uri: string, file?: any) => void;
  size?: number;
  editable?: boolean;
  placeholderUri?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUri,
  onImageSelect,
  size = 100,
  editable = false,
  placeholderUri,
}) => {
  const handlePickImage = usePickImage({
    setFile: (file: any) => {
      if (file && file.uri) {
        onImageSelect?.(file.uri, file);
      }
    },
    multiple: false,
  });

  const displayUri = imageUri || placeholderUri;

  return (
    <View style={tw`relative`}>
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={[
            tw`rounded-full`,
            { width: size, height: size },
          ]}
        />
      ) : (
        <View
          style={[
            tw`rounded-full bg-gray-200 items-center justify-center`,
            { width: size, height: size },
          ]}
        >
          <Ionicons name="person" size={size * 0.5} color="#9ca3af" />
        </View>
      )}
      {editable && (
        <TouchableOpacity
          style={[
            tw`absolute bottom-0 right-0 bg-blue-500 rounded-full p-1`,
            { width: size * 0.25, height: size * 0.25 },
          ]}
          onPress={handlePickImage}
        >
          <Ionicons name="pencil" size={size * 0.15} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProfileImage;