import React, { ReactNode, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';
import { AppText } from './Text';

const useNativeMotion = Platform.OS !== 'web';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const PrimaryButton = ({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: value,
      damping: 16,
      stiffness: 320,
      mass: 0.45,
      useNativeDriver: useNativeMotion,
    }).start();
  };

  const releasePop = () => {
    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.035,
        damping: 10,
        stiffness: 440,
        mass: 0.35,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 320,
        mass: 0.45,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={releasePop}
        disabled={disabled || loading}
        style={[styles.button, styles[variant], disabled && styles.disabled]}
      >
        <LinearGradient
          colors={variant === 'primary' ? ['#FFFFFF', '#D8D8D2'] : ['#191B20', '#101114']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonFill}
        >
          {loading ? <ActivityIndicator color={variant === 'primary' ? colors.black : colors.text} /> : icon}
          <AppText
            variant="caption"
            color={variant === 'primary' ? colors.black : colors.text}
            style={styles.label}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radii.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFill: {
    minHeight: 48,
    width: '100%',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
});
