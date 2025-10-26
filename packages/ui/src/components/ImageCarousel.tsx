import React, { useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import ImageViewerURI from './image-viewer';
import { theme } from '../theme';

interface ImageCarouselProps {
  urls: string[];
  imageHeight?: number;
  imageWidth?: number;
  showPaginationDots?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  urls,
  imageHeight = 400,
  imageWidth = screenWidth,
  showPaginationDots = true,
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
    <View style={styles.wrapper}>
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
      </View>
      {showPaginationDots && (
        <View style={styles.pagination}>
          {urls.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? theme.colors.pink1 : '#ccc',
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
  wrapper: {
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 12,
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