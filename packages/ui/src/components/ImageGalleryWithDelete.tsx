import React from 'react';
import { View, FlatList, Dimensions, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageViewerURI from './image-viewer';

interface ImageGalleryWithDeleteProps {
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  imageHeight?: number;
  imageWidth?: number;
  columns?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageGalleryWithDelete: React.FC<ImageGalleryWithDeleteProps> = ({
  imageUrls,
  setImageUrls,
  imageHeight = 150,
  imageWidth = screenWidth / 3 - 8, // Default to 3 columns with some margin
  columns = 3,
}) => {
  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  const numColumns = columns;
  const containerPadding = 16;

  const handleDeleteImage = (index: number) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newUrls = imageUrls.filter((_, i) => i !== index);
            setImageUrls(newUrls);
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
      <ImageViewerURI
        uri={item}
        style={[
          styles.image,
          {
            height: imageHeight,
            width: imageWidth,
          },
        ]}
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding / 2 }]}>
      <FlatList
        data={imageUrls}
        numColumns={numColumns}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 2,
  },
});

export default ImageGalleryWithDelete;