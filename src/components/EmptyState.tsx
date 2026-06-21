import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { AppText } from './Text';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: ReactNode;
}

export const EmptyState = ({ title, body, icon }: EmptyStateProps) => (
  <View style={styles.empty}>
    {icon ? <View style={styles.icon}>{icon}</View> : null}
    <AppText variant="subheading" style={styles.center}>
      {title}
    </AppText>
    <AppText variant="body" color={colors.textMuted} style={styles.center}>
      {body}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
