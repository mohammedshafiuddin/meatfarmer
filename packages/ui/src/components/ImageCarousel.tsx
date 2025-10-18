import React, { useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import ImageViewerURI from './image-viewer';

interface ImageCarouselProps {
  urls: string[];
  imageHeight?: number;
  imageWidth?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  urls,
  imageHeight = 400,
  imageWidth = screenWidth,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!urls || urls.length === 0) {
    return null;
  }

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    setActiveIndex(slideIndex);
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={[styles.slide, { width: imageWidth }]}>
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
    </View>
  );

  return (
    <View style={[styles.container, { height: imageHeight }]}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
      />
      {urls.length > 1 && (
        <View style={styles.pagination}>
          {urls.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? '#4f46e5' : '#ccc',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ImageCarousel;