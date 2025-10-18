import React from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MyText , tw , colors } from "common-ui";
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconButton } from 'react-native-paper';

interface DashboardHeaderProps {
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  onRefreshPress?: () => void;
  refreshing?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onMenuPress, 
  onNotificationsPress,
  onProfilePress,
  onRefreshPress,
  refreshing = false
}) => {
  const accentColor = useThemeColor({ light: '#4f46e5', dark: '#818cf8' }, 'tint');
  
  // For the refresh animation
  const spinAnim = React.useRef(new Animated.Value(0)).current;
  
  // Update animation when refreshing prop changes
  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (refreshing) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [refreshing]);
  
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <SafeAreaView edges={['top']} style={tw`mb-2 bg-white dark:bg-gray-900`}>
      <View style={tw`flex-row justify-between items-center px-4 py-2`}>
        {/* Menu Button */}
        <TouchableOpacity 
          style={tw`w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm`}
          onPress={onMenuPress}
        >
          <Ionicons name="menu" size={24} color={accentColor} />
        </TouchableOpacity>
        
        {/* Logo/App Name */}
        <MyText style={tw`text-xl font-bold text-gray-800 dark:text-white`}>
          HealthPetal
        </MyText>
        
        {/* Right Actions */}
        <View style={tw`flex-row`}>
          {/* Refresh Button */}
          {onRefreshPress && (
            <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
              <IconButton
                icon="refresh"
                size={20}
                onPress={onRefreshPress}
                accessibilityLabel="Refresh"
                disabled={refreshing}
                iconColor={colors.blue1}
              />
            </Animated.View>
          )}
          
          {/* Notifications */}
          <TouchableOpacity 
            style={tw`w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm mr-2 relative`}
            onPress={onNotificationsPress}
          >
            <Ionicons name="notifications" size={20} color="#6b7280" />
            {/* Notification Badge */}
            <View style={tw`absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full`}></View>
          </TouchableOpacity>
          
          {/* Profile */}
          <TouchableOpacity 
            style={tw`w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm`}
            onPress={onProfilePress}
          >
            <Ionicons name="person" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DashboardHeader;