import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { ImageViewerURI } from "common-ui";

interface HorizontalImageScrollerProps {
  urls: string[];
  imageHeight?: number;
  imageWidth?: number;
}

const HorizontalImageScroller: React.FC<HorizontalImageScrollerProps> = ({
  urls,
  imageHeight = 128,
  imageWidth = 128,
}) => {
  if (!urls || urls.length === 0) return null;
  console.log('loading image scroller')
  

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {urls.map((url, idx) => (
          <View key={idx} style={{ marginRight: 12 }}>
            <ImageViewerURI
              uri={url}
              style={{
                height: imageHeight,
                width: imageWidth,
                borderRadius: 12,
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});

export default HorizontalImageScroller;
