import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Activity, ArrowRight, Dumbbell, Medal, Plus, Timer, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { MotionPressable } from '../components/MotionPressable';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { RootStackParamList } from '../navigation/types';
import {
  generateOverloadSuggestion,
  getPersonalRecords,
  getWeeklyVolume,
  getWeeklyWorkoutCount,
} from '../services/recommendations';
import { colors, radii, spacing } from '../theme/theme';
import { formatShortDate } from '../utils/date';

export const WorkoutScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data } = useAppState();
  const records = getPersonalRecords(data.workoutSessions).slice(0, 4);
  const history = [...data.workoutSessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <AppScreen>
      <AppHeader />

      <View style={styles.summaryRow}>
        <SummaryTile label="This week" value={`${getWeeklyWorkoutCount(data.workoutSessions)} sessions`} />
        <SummaryTile label="Volume" value={`${Math.round(getWeeklyVolume(data.workoutSessions)).toLocaleString()} kg`} />
      </View>

      <SectionHeader title="Workout Plans" />
      {data.workoutPlans.map((plan) => {
        const suggestions = plan.exercises
          .slice(0, 2)
          .map((exercise) => generateOverloadSuggestion(exercise, data.workoutSessions));

        return (
          <Card key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planBadge}>
                <Activity size={20} color={colors.accent} />
              </View>
              <View style={styles.planText}>
                <AppText variant="subheading">{plan.title}</AppText>
                <AppText variant="body" color={colors.textMuted}>
                  {plan.focus}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {plan.estimatedMinutes}m
              </AppText>
            </View>

            <View style={styles.exerciseList}>
              {plan.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <AppText variant="body" style={styles.exerciseName} numberOfLines={1}>
                    {exercise.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {exercise.targetSets} x {exercise.targetReps.min}-{exercise.targetReps.max}
                  </AppText>
                </View>
              ))}
            </View>

            <View style={styles.suggestionBox}>
              <TrendingUp size={18} color={colors.accent} />
              <View style={styles.suggestionCopy}>
                {suggestions.map((suggestion) => (
                  <AppText key={suggestion.exerciseId} variant="caption" color={colors.textMuted}>
                    {suggestion.exerciseName}: {suggestion.headline}
                  </AppText>
                ))}
              </View>
            </View>

            <PrimaryButton
              label="Start workout"
              onPress={() => navigation.navigate('WorkoutDetail', { planId: plan.id })}
              icon={<ArrowRight size={18} color={colors.black} />}
            />
          </Card>
        );
      })}

      <SectionHeader title="Personal Records" />
      {records.length ? (
        <Card style={styles.recordCard}>
          {records.map((record) => (
            <View key={record.exerciseName} style={styles.recordRow}>
              <Medal size={18} color={colors.warning} />
              <View style={styles.recordText}>
                <AppText variant="body">{record.exerciseName}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {record.bestWeightKg} kg top set - {Math.round(record.bestVolume).toLocaleString()} kg volume
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {formatShortDate(record.date)}
              </AppText>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <EmptyState title="No PRs yet" body="Complete a workout and Volt Beta will surface your best sets." icon={<Medal color={colors.accent} />} />
        </Card>
      )}

      <SectionHeader title="History" />
      {history.length ? (
        history.map((session) => (
          <MotionPressable key={session.id} style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <Timer size={18} color={colors.blue} />
            </View>
            <View style={styles.historyText}>
              <AppText variant="body">{session.planTitle ?? 'Custom workout'}</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {formatShortDate(session.date)} - {session.durationMinutes} min - RPE {session.perceivedEffort}/10
              </AppText>
            </View>
            <AppText variant="caption" color={colors.accent}>
              {session.exercises.length} moves
            </AppText>
          </MotionPressable>
        ))
      ) : (
        <Card>
          <EmptyState title="No sessions logged" body="Start from a plan to build your overload history." icon={<Plus color={colors.accent} />} />
        </Card>
      )}
    </AppScreen>
  );
};

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <Card style={styles.summaryTile}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </Card>
);

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryTile: {
    flex: 1,
    gap: spacing.xs,
  },
  planCard: {
    gap: spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    flex: 1,
  },
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseName: {
    flex: 1,
  },
  suggestionBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  suggestionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  recordCard: {
    gap: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recordText: {
    flex: 1,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#10233B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
  },
});
