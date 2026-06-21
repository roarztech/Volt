import React, { ReactNode, useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

const useNativeMotion = Platform.OS !== 'web';

interface MotionPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  popScale?: number;
}

export const MotionPressable = ({
  children,
  style,
  activeScale = 0.97,
  popScale = 1.025,
  disabled,
  onPressIn,
  onPressOut,
  ...pressableProps
}: MotionPressableProps) => {
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
        toValue: popScale,
        damping: 10,
        stiffness: 420,
        mass: 0.35,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 300,
        mass: 0.45,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.motionWrap, disabled && styles.disabled, { transform: [{ scale }] }]}>
      <Pressable
        {...pressableProps}
        disabled={disabled}
        onPressIn={(event) => {
          animateTo(activeScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          releasePop();
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  motionWrap: {},
  disabled: {
    opacity: 0.5,
  },
});
