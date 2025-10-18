import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ImageViewerProps {
  uri: string;
  style?: any;
}

const ImageViewerURI: React.FC<ImageViewerProps> = ({ uri, style }) => {
  const [open, setOpen] = useState(false);
  const screen = Dimensions.get("window");
  const [loading, setLoading] = useState(false);

  const markLoading = () => {

    if(!Boolean(uri) || Platform.OS === "web") return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 30000); // Simulate loading for 30 seconds
  }
  
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>
        <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
          {loading && (
            <ActivityIndicator
              size={32}
              color="#888"
              style={{ position: 'absolute', alignSelf: 'center', zIndex: 2 }}
            />
          )}
          <Image
            onLoadStart={markLoading}
            onLoadEnd={() => setLoading(false)}
            source={{ uri }}
            style={style}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setOpen(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flex}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          >
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size={48}
                  color="#888"
                  style={{ alignSelf: "center" }}
                />
              </View>
            )}
            <Image
              source={{ uri }}
              style={{
                width: screen.width * 0.96,
                height: screen.height * 0.8,
                borderRadius: 12,
                alignSelf: "center",
                marginTop: screen.height * 0.1,
                backgroundColor: "#fff",
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 32,
    right: 24,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 4,
  },
  flex: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ImageViewerURI;
