import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';
import { LogoMark } from './LogoMark';
import { MotionPressable } from './MotionPressable';

export const AppHeader = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <View style={styles.sideSlot} />
      <View style={styles.logoStage}>
        <LogoMark size={48} animated bare />
      </View>
      <MotionPressable style={styles.profileButton} onPress={() => navigation.navigate('Profile')} activeScale={0.94}>
        <UserRound size={21} color={colors.text} />
      </MotionPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 58,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sideSlot: {
    width: 44,
    height: 44,
  },
  logoStage: {
    width: 58,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
