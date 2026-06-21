import { Activity, CalendarDays, Dumbbell, Flame, Scale, Utensils } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { calculateSessionVolume } from '../services/recommendations';
import { colors, radii, spacing } from '../theme/theme';
import { BodyProgress, Meal, WorkoutSession } from '../types';
import { formatShortDate, toISODate } from '../utils/date';

type HistoryDay = {
  date: string;
  workouts: WorkoutSession[];
  meals: Meal[];
  progressEntries: BodyProgress[];
  previousProgress?: BodyProgress;
  volume: number;
  duration: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const dayKey = (date: string) => date.slice(0, 10);

const formatLongDate = (date: string) =>
  new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  );

const formatWeightDelta = (current?: BodyProgress, previous?: BodyProgress) => {
  if (!current || !previous) {
    return null;
  }

  const delta = current.weightKg - previous.weightKg;

  if (Math.abs(delta) < 0.05) {
    return 'No weight change';
  }

  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg from last check-in`;
};

const buildHistoryDays = (workouts: WorkoutSession[], meals: Meal[], progress: BodyProgress[]): HistoryDay[] => {
  const dates = new Set<string>();

  workouts.forEach((session) => dates.add(dayKey(session.date)));
  meals.forEach((meal) => dates.add(dayKey(meal.date)));
  progress.forEach((entry) => dates.add(dayKey(entry.date)));

  const progressByDate = [...progress].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return [...dates]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => {
      const dayWorkouts = workouts.filter((session) => dayKey(session.date) === date);
      const dayMeals = meals.filter((meal) => dayKey(meal.date) === date);
      const dayProgress = progressByDate.filter((entry) => dayKey(entry.date) === date);
      const previousProgressEntries = progressByDate.filter((entry) => dayKey(entry.date) < date);

      return {
        date,
        workouts: dayWorkouts,
        meals: dayMeals,
        progressEntries: dayProgress,
        previousProgress: previousProgressEntries[previousProgressEntries.length - 1],
        volume: dayWorkouts.reduce((total, session) => total + calculateSessionVolume(session), 0),
        duration: dayWorkouts.reduce((total, session) => total + session.durationMinutes, 0),
        calories: dayMeals.reduce((total, meal) => total + meal.calories, 0),
        protein: dayMeals.reduce((total, meal) => total + meal.protein, 0),
        carbs: dayMeals.reduce((total, meal) => total + meal.carbs, 0),
        fats: dayMeals.reduce((total, meal) => total + meal.fats, 0),
      };
    });
};

export const HistoryScreen = () => {
  const { data } = useAppState();
  const days = useMemo(
    () => buildHistoryDays(data.workoutSessions, data.meals, data.bodyProgress),
    [data.bodyProgress, data.meals, data.workoutSessions],
  );
  const currentWeekDays = days.filter((day) => {
    const diffMs = new Date(`${toISODate()}T12:00:00`).getTime() - new Date(`${day.date}T12:00:00`).getTime();
    return diffMs >= 0 && diffMs <= 6 * 24 * 60 * 60 * 1000;
  });
  const weeklyVolume = currentWeekDays.reduce((total, day) => total + day.volume, 0);
  const weeklyCalories = currentWeekDays.reduce((total, day) => total + day.calories, 0);
  const latestDay = days[0];

  return (
    <AppScreen>
      <AppHeader />

      <Card elevated style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <CalendarDays size={20} color={colors.black} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="caption" color={colors.textMuted}>
              SAVED LOGS
            </AppText>
            <AppText variant="subheading">
              {latestDay ? `${formatShortDate(latestDay.date)} is your latest saved day.` : 'Your saved days will appear here.'}
            </AppText>
          </View>
        </View>
        <View style={styles.heroStats}>
          <HistoryStat label="Days" value={`${days.length}`} accent={colors.accent} />
          <HistoryStat label="7d volume" value={`${Math.round(weeklyVolume).toLocaleString()} kg`} accent={colors.blue} />
          <HistoryStat label="7d food" value={`${Math.round(weeklyCalories).toLocaleString()}`} accent={colors.gold} />
        </View>
      </Card>

      <SectionHeader title="Saved Days" />
      {days.length ? (
        days.map((day) => <DayCard key={day.date} day={day} />)
      ) : (
        <Card>
          <EmptyState
            title="No history yet"
            body="Log workouts, meals, or body check-ins and Volt will build your daily timeline."
            icon={<CalendarDays color={colors.accent} />}
          />
        </Card>
      )}
    </AppScreen>
  );
};

const DayCard = ({ day }: { day: HistoryDay }) => {
  const latestProgress = day.progressEntries[day.progressEntries.length - 1];
  const weightDelta = formatWeightDelta(latestProgress, day.previousProgress);
  const completionLine = [
    day.workouts.length ? `${day.workouts.length} workout${day.workouts.length > 1 ? 's' : ''}` : null,
    day.meals.length ? `${day.meals.length} meal${day.meals.length > 1 ? 's' : ''}` : null,
    day.progressEntries.length ? 'body check-in' : null,
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <Card style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={styles.datePill}>
          <AppText variant="caption" color={colors.black}>
            {day.date === toISODate() ? 'TODAY' : formatShortDate(day.date).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.dayTitle}>
          <AppText variant="subheading">{formatLongDate(day.date)}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {completionLine || 'Saved day'}
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <MiniStat icon={<Flame size={16} color={colors.gold} />} label="Calories" value={`${day.calories}`} />
        <MiniStat icon={<Utensils size={16} color={colors.success} />} label="Protein" value={`${day.protein}g`} />
        <MiniStat icon={<Dumbbell size={16} color={colors.blue} />} label="Volume" value={`${Math.round(day.volume).toLocaleString()} kg`} />
      </View>

      <View style={styles.progressStrip}>
        <Activity size={17} color={colors.accent} />
        <AppText variant="body" style={styles.progressCopy}>
          {day.volume
            ? `${Math.round(day.volume).toLocaleString()} kg moved across ${day.duration} minutes.`
            : day.meals.length
              ? `${day.calories} calories and ${day.protein}g protein logged.`
              : weightDelta ?? 'Body check-in saved for this date.'}
        </AppText>
      </View>

      {day.workouts.length ? (
        <View style={styles.sectionStack}>
          <AppText variant="caption" color={colors.textMuted}>
            WORKOUTS
          </AppText>
          {day.workouts.map((session) => (
            <View key={session.id} style={styles.historyRow}>
              <View style={[styles.rowIcon, styles.workoutIcon]}>
                <Dumbbell size={16} color={colors.blue} />
              </View>
              <View style={styles.rowCopy}>
                <AppText variant="body">{session.planTitle ?? 'Custom workout'}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {session.exercises.length} exercises - {session.durationMinutes} min - RPE {session.perceivedEffort}/10
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {day.meals.length ? (
        <View style={styles.sectionStack}>
          <AppText variant="caption" color={colors.textMuted}>
            MEALS
          </AppText>
          {day.meals.map((meal) => (
            <View key={meal.id} style={styles.historyRow}>
              <View style={[styles.rowIcon, styles.mealIcon]}>
                <Utensils size={16} color={colors.success} />
              </View>
              <View style={styles.rowCopy}>
                <AppText variant="body">{meal.title}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {meal.mealType} - {meal.calories} kcal - {meal.protein}g protein
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {latestProgress ? (
        <View style={styles.sectionStack}>
          <AppText variant="caption" color={colors.textMuted}>
            BODY PROGRESS
          </AppText>
          <View style={styles.historyRow}>
            <View style={[styles.rowIcon, styles.bodyIcon]}>
              <Scale size={16} color={colors.gold} />
            </View>
            <View style={styles.rowCopy}>
              <AppText variant="body">
                {latestProgress.weightKg} kg{latestProgress.waistCm ? ` - ${latestProgress.waistCm} cm waist` : ''}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {weightDelta ?? latestProgress.notes ?? 'Body check-in saved'}
              </AppText>
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
};

const HistoryStat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <View style={styles.heroStat}>
    <View style={[styles.statLine, { backgroundColor: accent }]} />
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </View>
);

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.miniStat}>
    {icon}
    <View style={styles.miniStatCopy}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    minHeight: 82,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  statLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  dayCard: {
    gap: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  datePill: {
    minWidth: 70,
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  dayTitle: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniStat: {
    flex: 1,
    minHeight: 74,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  miniStatCopy: {
    gap: 2,
  },
  progressStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
  },
  progressCopy: {
    flex: 1,
  },
  sectionStack: {
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutIcon: {
    backgroundColor: '#10233B',
  },
  mealIcon: {
    backgroundColor: '#102E24',
  },
  bodyIcon: {
    backgroundColor: '#312914',
  },
  rowCopy: {
    flex: 1,
  },
});
