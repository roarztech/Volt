import React, { ReactNode, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';
import { AppText } from './Text';

const useNativeMotion = Platform.OS !== 'web';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}

export const Pill = ({ label, selected = false, onPress, icon }: PillProps) => {
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
        toValue: 1.04,
        damping: 10,
        stiffness: 430,
        mass: 0.35,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 310,
        mass: 0.45,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.95)}
        onPressOut={releasePop}
        style={[styles.pill, selected && styles.selected]}
      >
        <LinearGradient
          colors={selected ? ['#FFFFFF', '#D9D9D5'] : ['#15171B', '#0D0E11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillFill}
        >
          {icon}
          <AppText variant="caption" color={selected ? colors.black : colors.text} numberOfLines={1}>
            {label}
          </AppText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    minHeight: 40,
    borderRadius: radii.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillFill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
