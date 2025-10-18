import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme , tw } from "common-ui";

interface Props {
  style?: object;
}

const DecorativeGraphics: React.FC<Props> = ({ style }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.circle, { 
        backgroundColor: theme.colors.blue2, 
        opacity: 0.3,
        width: 120,
        height: 120,
        top: -30,
        left: -30,
      }]} />
      <View style={[styles.circle, { 
        backgroundColor: theme.colors.blue3, 
        opacity: 0.5,
        width: 80,
        height: 80,
        top: 20,
        right: -20,
      }]} />
      <View style={[styles.circle, { 
        backgroundColor: theme.colors.green2, 
        opacity: 0.4,
        width: 60,
        height: 60,
        bottom: 0,
        left: 20,
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  circle: {
    borderRadius: 100,
    position: 'absolute',
  },
});

export default DecorativeGraphics;