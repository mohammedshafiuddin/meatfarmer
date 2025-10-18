import { useTheme } from "common-ui";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, TouchableOpacity, ViewStyle } from 'react-native';
// import { useTheme } from '../hooks/theme-context';

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
  disabled?: boolean;
  checkedColor?: string; // deprecated, use checkColor
  fillColor?: string; // new prop for box/circle fill
  checkColor?: string; // new prop for check/tick color
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  style,
  size = 24,
  disabled = false,
  checkedColor, // deprecated
  fillColor,
  checkColor,
}) => {
  const { colors } = useTheme().theme;
  const fill = fillColor || colors.blue1;
  const check = checkColor || colors.white1;
  const iconName = Platform.OS === 'android'
    ? checked ? 'checkbox-marked' : 'checkbox-blank-outline'
    : checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={size}
        color={disabled ? colors.gray1 : fill}
      />
      {/* If checked, overlay a check icon with checkColor (for circle/box) */}
      {/* Not implemented here due to icon limitations, but checkColor is available for future use */}
    </TouchableOpacity>
  );
};

export default Checkbox;
