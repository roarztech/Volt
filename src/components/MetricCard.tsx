import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { Card } from './Card';
import { AppText } from './Text';

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  accent?: string;
}

export const MetricCard = ({ label, value, detail, icon, accent = colors.accent }: MetricCardProps) => (
  <Card style={styles.card}>
    <View style={[styles.accentLine, { backgroundColor: accent }]} />
    <View style={styles.topRow}>
      <AppText variant="caption" color={colors.textMuted} style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>{icon}</View>
    </View>
    <AppText variant="heading" style={styles.value}>
      {value}
    </AppText>
    {detail ? (
      <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
        {detail}
      </AppText>
    ) : null}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 132,
    gap: spacing.sm,
    position: 'relative',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.9,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    textTransform: 'uppercase',
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: spacing.xs,
  },
});
