import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';
import { AppText } from './Text';

interface ProgressBarProps {
  label: string;
  value: number;
  target: number;
  accent?: string;
  suffix?: string;
}

export const ProgressBar = ({ label, value, target, accent = colors.accent, suffix = '' }: ProgressBarProps) => {
  const progress = Math.min(100, Math.max(0, (value / Math.max(target, 1)) * 100));
  const scaleX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleX, {
      toValue: progress / 100,
      damping: 18,
      stiffness: 110,
      mass: 0.7,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [progress, scaleX]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
        <AppText variant="caption">
          {Math.round(value)}
          {suffix} / {Math.round(target)}
          {suffix}
        </AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: accent, transform: [{ scaleX }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  track: {
    height: 9,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: radii.sm,
    transformOrigin: 'left center',
  },
});
