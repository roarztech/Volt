import React, { ReactNode } from 'react';
import { Text as RNText, StyleProp, TextStyle } from 'react-native';
import { colors, typography } from '../theme/theme';

type TextVariant = keyof typeof typography;

interface AppTextProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const AppText = ({
  children,
  variant = 'body',
  color = colors.text,
  style,
  numberOfLines,
}: AppTextProps) => (
  <RNText numberOfLines={numberOfLines} style={[typography[variant], { color }, style]}>
    {children}
  </RNText>
);
