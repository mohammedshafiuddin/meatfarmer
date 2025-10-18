import React from 'react';
import { View, FlatList, Dimensions, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ImageViewerURI from './image-viewer';

interface ImageGalleryProps {
  urls: string[];
  imageHeight?: number;
  imageWidth?: number;
  columns?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageGallery: React.FC<ImageGalleryProps> = ({
  urls,
  imageHeight = 150,
  imageWidth = screenWidth / 3 - 8, // Default to 3 columns with some margin
  columns = 3,
}) => {
  if (!urls || urls.length === 0) {
    return null;
  }

  const numColumns = columns;
  const containerPadding = 16;

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
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
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding / 2 }]}>
      <FlatList
        data={urls}
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
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
  },
});

export default ImageGallery;