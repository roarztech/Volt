import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, radii } from '../theme/theme';

const useNativeMotion = Platform.OS !== 'web';

interface LogoMarkProps {
  size?: number;
  animated?: boolean;
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const LogoMark = ({ size = 44, animated = false, bare = false, style }: LogoMarkProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.025,
          duration: 1400,
          useNativeDriver: useNativeMotion,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: useNativeMotion,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [animated, scale]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: Math.max(radii.sm, size * 0.22),
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {!bare ? <Rect x={1} y={1} width={198} height={198} rx={40} fill="#0A0A0A" stroke={colors.cardBorder} strokeWidth={2} /> : null}
        <Path d="M45 55 L100 160 L155 55 L130 55 L100 118 L70 55 Z" fill={colors.white} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
});
