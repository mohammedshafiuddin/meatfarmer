import React from 'react';
import { Text as PaperText } from 'react-native-paper';
import { TextProps as RNTextProps } from 'react-native';
import { useTheme } from "common-ui";
import type { Theme } from "common-ui";
// import { useTheme } from '../hooks/theme-context';

// All color keys from theme.colors
// import type { Theme } from '../hooks/theme-context';
type ThemeColor = keyof Theme['colors'];

type FontWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

interface Props extends RNTextProps {
  children: React.ReactNode;
  color?: ThemeColor;
  weight?: FontWeight;
}

function MyText({ style, children, color, weight = 'regular', ...rest }: Props) {
  const { colors } = useTheme().theme;

  // Map weight to fontFamily and fontWeight
  let fontFamily = 'Nunito-Regular';
  let fontWeight: any = undefined;
  switch (weight) {
    case 'light':
      fontFamily = 'Nunito-Light';
      fontWeight = '300';
      break;
    case 'regular':
      fontFamily = 'Nunito-Regular';
      fontWeight = '400';
      break;
    case 'medium':
      fontFamily = 'Nunito-Medium';
      fontWeight = '500';
      break;
    case 'semibold':
      fontFamily = 'Nunito-SemiBold';
      fontWeight = '600';
      break;
    case 'bold':
      fontFamily = 'Nunito-Bold';
      fontWeight = '700';
      break;
  }

  let textColor: string | undefined;
  if (color && colors[color]) textColor = colors[color];
  return (
    <PaperText
      {...rest}
      style={[
        { fontFamily, color: textColor, fontWeight },
        style,
      ]}
    >
      {children}
    </PaperText>
  );
}

export default MyText;
