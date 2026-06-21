import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../theme/theme';
import { AppText } from './Text';

interface TrendChartProps {
  values: number[];
  labels: string[];
  height?: number;
  accent?: string;
}

export const TrendChart = ({ values, labels, height = 170, accent = colors.accent }: TrendChartProps) => {
  if (values.length === 0) {
    return null;
  }

  const width = 320;
  const padding = 28;
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const span = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = padding + ((max - value) / span) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={styles.chartWrap}>
      <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.cardBorder} />
        <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={colors.cardBorder} />
        <Polyline points={points} fill="none" stroke={accent} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
          const y = padding + ((max - value) / span) * (height - padding * 2);
          return <Circle key={`${value}-${index}`} cx={x} cy={y} r={4} fill={accent} />;
        })}
        {labels.map((label, index) => {
          const x = padding + (index / Math.max(labels.length - 1, 1)) * (width - padding * 2);
          return (
            <SvgText key={`${label}-${index}`} x={x} y={height - 8} fill={colors.textMuted} fontSize="10" textAnchor="middle">
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

export const BarChart = ({ values, labels, height = 170, accent = colors.blue }: TrendChartProps) => {
  if (values.length === 0) {
    return null;
  }

  const width = 320;
  const padding = 28;
  const barGap = 10;
  const max = Math.max(...values, 1);
  const barWidth = (width - padding * 2 - barGap * (values.length - 1)) / Math.max(values.length, 1);

  return (
    <View style={styles.chartWrap}>
      <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.cardBorder} />
        {values.map((value, index) => {
          const barHeight = ((height - padding * 2) * value) / max;
          const x = padding + index * (barWidth + barGap);
          const y = height - padding - barHeight;

          return (
            <React.Fragment key={`${value}-${index}`}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} rx={5} fill={accent} opacity={0.9} />
              <SvgText x={x + barWidth / 2} y={height - 8} fill={colors.textMuted} fontSize="10" textAnchor="middle">
                {labels[index]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

export const ChartLabel = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.labelRow}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="caption">{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  chartWrap: {
    overflow: 'hidden',
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
