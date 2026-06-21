import { Activity, Bot, CalendarDays, Flame, Scale, Utensils, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { summarizeDailyNutrition } from '../services/nutrition';
import {
  generateOverloadSuggestion,
  getConsistencyPercent,
  getWeeklyVolume,
  getWeeklyWorkoutCount,
} from '../services/recommendations';
import { colors, radii, spacing } from '../theme/theme';

export const DashboardScreen = () => {
  const { data, error } = useAppState();
  const profile = data.profile;
  const dailyNutrition = useMemo(() => summarizeDailyNutrition(data.meals, profile), [data.meals, profile]);
  const workoutToday = data.workoutPlans[0];
  const latestProgress = data.bodyProgress[data.bodyProgress.length - 1];
  const weeklyWorkoutCount = getWeeklyWorkoutCount(data.workoutSessions);
  const weeklyVolume = getWeeklyVolume(data.workoutSessions);
  const consistency = getConsistencyPercent(data.workoutSessions);
  const caloriesLeft = Math.max(0, dailyNutrition.targetCalories - dailyNutrition.calories);
  const proteinPercent = Math.min(100, Math.round((dailyNutrition.protein / Math.max(dailyNutrition.targetProtein, 1)) * 100));
  const firstSuggestion = workoutToday?.exercises[0]
    ? generateOverloadSuggestion(workoutToday.exercises[0], data.workoutSessions)
    : null;
  const coachMessage = data.coachMessages[data.coachMessages.length - 1];

  return (
    <AppScreen>
      <AppHeader />

      {error ? (
        <Card style={styles.warning}>
          <AppText variant="caption" color={colors.warning}>
            {error}
          </AppText>
        </Card>
      ) : null}

      <Card elevated style={styles.signalCard}>
        <View style={styles.signalTopRow}>
          <View style={styles.signalBadge}>
            <Bot size={17} color={colors.black} />
            <AppText variant="caption" color={colors.black}>
              COACH SIGNAL
            </AppText>
          </View>
          <View style={styles.readinessPill}>
            <Zap size={14} color={colors.gold} />
            <AppText variant="caption" color={colors.text}>
              {consistency}% READY
            </AppText>
          </View>
        </View>
        <AppText variant="subheading" style={styles.signalCopy}>
          {coachMessage?.content ?? 'Log your next action and Volt will coach the pattern.'}
        </AppText>
        <View style={styles.signalRail}>
          <SignalMetric label="Calories left" value={`${caloriesLeft}`} accent={colors.gold} />
          <SignalMetric label="Protein hit" value={`${proteinPercent}%`} accent={colors.success} />
          <SignalMetric label="Sessions" value={`${weeklyWorkoutCount}/4`} accent={colors.blue} />
        </View>
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Calories eaten"
          value={`${dailyNutrition.calories}`}
          detail={`${caloriesLeft} kcal left`}
          icon={<Flame size={19} color={colors.accent} />}
        />
        <MetricCard
          label="Protein target"
          value={`${dailyNutrition.protein}g`}
          detail={`${dailyNutrition.targetProtein}g target`}
          icon={<Utensils size={19} color={colors.success} />}
          accent={colors.success}
        />
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Workout today"
          value={workoutToday?.title ?? 'Rest'}
          detail={workoutToday ? `${workoutToday.estimatedMinutes} min - ${workoutToday.focus}` : 'Recovery and steps'}
          icon={<DumbbellIcon />}
          accent={colors.blue}
        />
        <MetricCard
          label="Body weight"
          value={`${latestProgress?.weightKg ?? profile?.weightKg ?? '--'} kg`}
          detail={`${consistency}% weekly adherence`}
          icon={<Scale size={19} color={colors.warning} />}
          accent={colors.warning}
        />
      </View>

      <Card style={styles.stack}>
        <SectionHeader title="Daily Nutrition" />
        <ProgressBar label="Calories" value={dailyNutrition.calories} target={dailyNutrition.targetCalories} />
        <ProgressBar label="Protein" value={dailyNutrition.protein} target={dailyNutrition.targetProtein} suffix="g" accent={colors.success} />
        <View style={styles.macroRow}>
          <Macro label="Carbs" value={`${dailyNutrition.carbs}g`} />
          <Macro label="Fats" value={`${dailyNutrition.fats}g`} />
        </View>
      </Card>

      <Card style={styles.stack}>
        <SectionHeader title="Training Load" />
        <View style={styles.planRow}>
          <View style={styles.planIcon}>
            <CalendarDays size={20} color={colors.accent} />
          </View>
          <View style={styles.planText}>
            <AppText variant="subheading">{workoutToday?.title ?? 'No plan selected'}</AppText>
            <AppText variant="body" color={colors.textMuted}>
              {workoutToday?.focus ?? 'Create a session from the workout tab.'}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.accent}>
            {weeklyWorkoutCount} / 4
          </AppText>
        </View>
        <View style={styles.statsRow}>
          <Stat label="Weekly volume" value={`${Math.round(weeklyVolume).toLocaleString()} kg`} />
          <Stat label="Adherence" value={`${consistency}%`} />
        </View>
        {firstSuggestion ? (
          <View style={styles.suggestion}>
            <Zap size={18} color={colors.accent} />
            <AppText variant="body" style={styles.suggestionText}>
              {firstSuggestion.exerciseName}: {firstSuggestion.headline}. {firstSuggestion.detail}
            </AppText>
          </View>
        ) : null}
      </Card>
    </AppScreen>
  );
};

const DumbbellIcon = () => <Activity size={19} color={colors.blue} />;

const SignalMetric = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <View style={styles.signalMetric}>
    <View style={[styles.signalDot, { backgroundColor: accent }]} />
    <View>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  </View>
);

const Macro = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.macro}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </View>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  warning: {
    borderColor: colors.warning,
  },
  signalCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  signalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  signalBadge: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  readinessPill: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  signalCopy: {
    lineHeight: 26,
  },
  signalRail: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signalMetric: {
    flex: 1,
    minHeight: 70,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  signalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stack: {
    gap: spacing.lg,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macro: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  suggestion: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
  },
  suggestionText: {
    flex: 1,
  },
});
