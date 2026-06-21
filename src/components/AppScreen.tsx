import { useFocusEffect } from '@react-navigation/native';
import React, { ReactNode, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/theme';

const useNativeMotion = Platform.OS !== 'web';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export const AppScreen = ({ children, scroll = true, contentStyle }: AppScreenProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(14);

      const entrance = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: useNativeMotion,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 140,
          mass: 0.8,
          useNativeDriver: useNativeMotion,
        }),
      ]);

      entrance.start();

      return () => {
        entrance.stop();
      };
    }, [opacity, translateY]),
  );

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#111217', '#050506', '#000000']} style={styles.gradient}>
          <Animated.View style={[styles.content, contentStyle, { opacity, transform: [{ translateY }] }]}>
            {children}
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#111217', '#050506', '#000000']} style={styles.gradient}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, contentStyle, { opacity, transform: [{ translateY }] }]}>
            {children}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
