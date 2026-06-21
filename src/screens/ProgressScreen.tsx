import { Camera, Dumbbell, Flame, Scale, TrendingUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { BarChart, ChartLabel, TrendChart } from '../components/Chart';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { calculateSessionVolume, getConsistencyPercent, getWeeklyWorkoutCount } from '../services/recommendations';
import { colors, radii, spacing } from '../theme/theme';
import { BodyProgress } from '../types';
import { formatShortDate, toISODate } from '../utils/date';

export const ProgressScreen = () => {
  const { data, addBodyProgress } = useAppState();
  const latest = data.bodyProgress[data.bodyProgress.length - 1];
  const [weightKg, setWeightKg] = useState(latest ? String(latest.weightKg) : '');
  const [waistCm, setWaistCm] = useState(latest?.waistCm ? String(latest.waistCm) : '');
  const [notes, setNotes] = useState('');

  const weightValues = data.bodyProgress.map((entry) => entry.weightKg).slice(-8);
  const weightLabels = data.bodyProgress.map((entry) => formatShortDate(entry.date)).slice(-8);
  const volumeData = useMemo(() => {
    const recentSessions = [...data.workoutSessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6);

    return {
      values: recentSessions.map(calculateSessionVolume),
      labels: recentSessions.map((session) => formatShortDate(session.date)),
    };
  }, [data.workoutSessions]);
  const firstWeight = data.bodyProgress[0]?.weightKg;
  const weightChange = latest && firstWeight ? latest.weightKg - firstWeight : 0;
  const consistency = getConsistencyPercent(data.workoutSessions);
  const streak = getTrainingStreak(data.workoutSessions.map((session) => session.date));

  const saveProgress = () => {
    const entry: BodyProgress = {
      id: `body-${Date.now()}`,
      date: toISODate(),
      weightKg: Number(weightKg) || latest?.weightKg || 0,
      waistCm: Number(waistCm) || undefined,
      notes: notes.trim(),
    };

    addBodyProgress(entry);
    setNotes('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScreen>
        <AppHeader />

        <View style={styles.summaryRow}>
          <ProgressTile icon={<Scale color={colors.accent} size={19} />} label="Weight" value={`${latest?.weightKg ?? '--'} kg`} />
          <ProgressTile icon={<Flame color={colors.warning} size={19} />} label="Trend" value={`${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} kg`} />
        </View>
        <View style={styles.summaryRow}>
          <ProgressTile icon={<Dumbbell color={colors.blue} size={19} />} label="This week" value={`${getWeeklyWorkoutCount(data.workoutSessions)} sessions`} />
          <ProgressTile icon={<TrendingUp color={colors.success} size={19} />} label="Adherence" value={`${consistency}%`} />
        </View>

        <Card style={styles.stack}>
          <SectionHeader title="Weight Trend" />
          {weightValues.length ? (
            <>
              <TrendChart values={weightValues} labels={weightLabels} />
              <ChartLabel label="Latest" value={`${latest?.weightKg ?? '--'} kg`} />
            </>
          ) : (
            <EmptyState title="No weigh-ins" body="Add your first body weight entry." icon={<Scale color={colors.accent} />} />
          )}
        </Card>

        <Card style={styles.stack}>
          <SectionHeader title="Workout Volume" />
          {volumeData.values.length ? (
            <>
              <BarChart values={volumeData.values} labels={volumeData.labels} />
              <ChartLabel label="Streak" value={`${streak} training days`} />
            </>
          ) : (
            <EmptyState title="No volume yet" body="Complete a workout to build your volume chart." icon={<Dumbbell color={colors.accent} />} />
          )}
        </Card>

        <Card style={styles.stack}>
          <SectionHeader title="Add Check-In" />
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <AppText variant="caption" color={colors.textMuted}>
                Weight kg
              </AppText>
              <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" style={styles.input} />
            </View>
            <View style={styles.inputWrap}>
              <AppText variant="caption" color={colors.textMuted}>
                Waist cm
              </AppText>
              <TextInput value={waistCm} onChangeText={setWaistCm} keyboardType="decimal-pad" style={styles.input} />
            </View>
          </View>
          <View style={styles.inputWrap}>
            <AppText variant="caption" color={colors.textMuted}>
              Notes
            </AppText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Sleep, pump, photos, energy"
              placeholderTextColor={colors.textSubtle}
              multiline
              style={[styles.input, styles.noteInput]}
            />
          </View>
          <PrimaryButton label="Save check-in" onPress={saveProgress} />
        </Card>

        <Card style={styles.photoCard}>
          <View style={styles.photoPlaceholder}>
            <Camera size={26} color={colors.textMuted} />
            <AppText variant="body" color={colors.textMuted}>
              Progress photo placeholder
            </AppText>
          </View>
          <View style={styles.measurements}>
            <Measurement label="Waist" value={latest?.waistCm ? `${latest.waistCm} cm` : '--'} />
            <Measurement label="Chest" value={latest?.chestCm ? `${latest.chestCm} cm` : '--'} />
            <Measurement label="Hips" value={latest?.hipsCm ? `${latest.hipsCm} cm` : '--'} />
          </View>
        </Card>
      </AppScreen>
    </KeyboardAvoidingView>
  );
};

const getTrainingStreak = (dates: string[]) => {
  const uniqueDays = Array.from(new Set(dates.map((date) => date.slice(0, 10)))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(uniqueDays[index - 1]);
    const current = new Date(uniqueDays[index]);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays <= 3) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const ProgressTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card style={styles.tile}>
    {icon}
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </Card>
);

const Measurement = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.measurement}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="body">{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    gap: spacing.sm,
    minHeight: 126,
  },
  stack: {
    gap: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputWrap: {
    flex: 1,
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 84,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  photoCard: {
    gap: spacing.lg,
  },
  photoPlaceholder: {
    minHeight: 150,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundElevated,
  },
  measurements: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  measurement: {
    flex: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
