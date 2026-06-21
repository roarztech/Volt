import React, { ReactNode, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Platform, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

const useNativeMotion = Platform.OS !== 'web';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const Card = ({ children, style, elevated = false }: CardProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 160,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[styles.card, elevated && styles.elevated, style, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={elevated ? ['#1B1D22', '#101114'] : ['#14161A', '#0C0D10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundLayer}
      />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  elevated: {
    borderColor: '#3A3D44',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
