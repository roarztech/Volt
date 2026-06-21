import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Check, Minus, Plus, Save, Timer } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { LogoMark } from '../components/LogoMark';
import { MotionPressable } from '../components/MotionPressable';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { RootStackParamList } from '../navigation/types';
import { generateOverloadSuggestion } from '../services/recommendations';
import { colors, radii, spacing } from '../theme/theme';
import { SetEffort, WorkoutExerciseLog, WorkoutSession } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetail'>;

const effortOptions: SetEffort[] = ['easy', 'moderate', 'hard', 'failed'];

export const WorkoutDetailScreen = ({ route, navigation }: Props) => {
  const { data, addWorkoutSession } = useAppState();
  const plan = data.workoutPlans.find((item) => item.id === route.params.planId) ?? data.workoutPlans[0];
  const initialLogs = useMemo<WorkoutExerciseLog[]>(
    () =>
      plan.exercises.map((exercise) => {
        const suggestion = generateOverloadSuggestion(exercise, data.workoutSessions);
        const weight = suggestion.nextWeightKg || (exercise.equipment === 'bodyweight' ? 0 : 20);

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
          sets: Array.from({ length: suggestion.nextSets }).map((_, index) => ({
            id: `${exercise.id}-set-${index}`,
            reps: suggestion.nextReps,
            weightKg: weight,
            completed: true,
            effort: 'moderate',
          })),
        };
      }),
    [data.workoutSessions, plan.exercises],
  );
  const [logs, setLogs] = useState<WorkoutExerciseLog[]>(initialLogs);
  const [durationMinutes, setDurationMinutes] = useState(String(plan.estimatedMinutes));
  const [perceivedEffort, setPerceivedEffort] = useState('7');
  const [notes, setNotes] = useState('');

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    patch: Partial<WorkoutExerciseLog['sets'][number]>,
  ) => {
    setLogs((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, innerIndex) => (innerIndex === setIndex ? { ...set, ...patch } : set)),
            }
          : exercise,
      ),
    );
  };

  const addSet = (exerciseIndex: number) => {
    setLogs((current) =>
      current.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              ...lastSet,
              id: `${exercise.exerciseId}-set-${Date.now()}`,
            },
          ],
        };
      }),
    );
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setLogs((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, innerIndex) => innerIndex !== setIndex),
            }
          : exercise,
      ),
    );
  };

  const saveSession = () => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      planId: plan.id,
      planTitle: plan.title,
      date: new Date().toISOString(),
      durationMinutes: Number(durationMinutes) || plan.estimatedMinutes,
      perceivedEffort: Number(perceivedEffort) || 7,
      exercises: logs,
      notes: notes.trim(),
    };

    addWorkoutSession(session);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScreen>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MotionPressable style={styles.backButton} onPress={() => navigation.goBack()} activeScale={0.94}>
              <ArrowLeft size={21} color={colors.text} />
            </MotionPressable>
            <View style={styles.headerCopy}>
              <AppText variant="caption" color={colors.accent}>
                LOG SESSION
              </AppText>
              <AppText variant="heading" numberOfLines={1}>
                {plan.title}
              </AppText>
              <AppText variant="body" color={colors.textMuted} numberOfLines={1}>
                {plan.focus}
              </AppText>
            </View>
          </View>
          <LogoMark size={48} />
        </View>

        <Card style={styles.sessionMeta}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <AppText variant="caption" color={colors.textMuted}>
                Minutes
              </AppText>
              <TextInput
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.inputWrap}>
              <AppText variant="caption" color={colors.textMuted}>
                Effort 1-10
              </AppText>
              <TextInput
                value={perceivedEffort}
                onChangeText={setPerceivedEffort}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.noteWrap}>
            <AppText variant="caption" color={colors.textMuted}>
              Notes
            </AppText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Energy, pain, setup changes"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, styles.noteInput]}
              multiline
            />
          </View>
        </Card>

        {logs.map((exercise, exerciseIndex) => (
          <Card key={exercise.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitle}>
                <AppText variant="subheading">{exercise.exerciseName}</AppText>
                <View style={styles.restRow}>
                  <Timer size={14} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textMuted}>
                    {exercise.restSeconds}s rest - {exercise.muscleGroup}
                  </AppText>
                </View>
              </View>
              <PrimaryButton
                label="Set"
                onPress={() => addSet(exerciseIndex)}
                variant="secondary"
                icon={<Plus size={16} color={colors.text} />}
                style={styles.smallButton}
              />
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setBlock}>
                <View style={styles.setHeader}>
                  <AppText variant="caption" color={colors.textMuted}>
                    Set {setIndex + 1}
                  </AppText>
                  <View style={styles.setActions}>
                    <MotionPressable
                      style={[styles.doneButton, set.completed && styles.doneSelected]}
                      onPress={() => updateSet(exerciseIndex, setIndex, { completed: !set.completed })}
                      activeScale={0.9}
                    >
                      <Check size={14} color={set.completed ? colors.black : colors.textMuted} />
                    </MotionPressable>
                    {exercise.sets.length > 1 ? (
                      <MotionPressable style={styles.doneButton} onPress={() => removeSet(exerciseIndex, setIndex)} activeScale={0.9}>
                        <Minus size={14} color={colors.textMuted} />
                      </MotionPressable>
                    ) : null}
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputWrap}>
                    <AppText variant="caption" color={colors.textMuted}>
                      Weight kg
                    </AppText>
                    <TextInput
                      value={String(set.weightKg)}
                      onChangeText={(value) => updateSet(exerciseIndex, setIndex, { weightKg: Number(value) || 0 })}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputWrap}>
                    <AppText variant="caption" color={colors.textMuted}>
                      Reps
                    </AppText>
                    <TextInput
                      value={String(set.reps)}
                      onChangeText={(value) => updateSet(exerciseIndex, setIndex, { reps: Number(value) || 0 })}
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </View>
                </View>
                <View style={styles.pillWrap}>
                  {effortOptions.map((effort) => (
                    <Pill
                      key={effort}
                      label={effort}
                      selected={set.effort === effort}
                      onPress={() => updateSet(exerciseIndex, setIndex, { effort })}
                    />
                  ))}
                </View>
              </View>
            ))}
          </Card>
        ))}
      </AppScreen>
      <View style={styles.saveDock}>
        <View style={styles.saveDockCopy}>
          <AppText variant="caption" color={colors.textMuted}>
            UNSAVED SESSION
          </AppText>
          <AppText variant="body" numberOfLines={1}>
            {logs.length} exercises - {durationMinutes || plan.estimatedMinutes} min
          </AppText>
        </View>
        <PrimaryButton
          label="Save workout"
          onPress={saveSession}
          icon={<Save size={18} color={colors.black} />}
          style={styles.saveDockButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  sessionMeta: {
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
  noteWrap: {
    gap: spacing.sm,
  },
  noteInput: {
    minHeight: 88,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  exerciseCard: {
    gap: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseTitle: {
    flex: 1,
    gap: spacing.xs,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  setBlock: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  doneButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  doneSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  saveDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  saveDockCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  saveDockButton: {
    minWidth: 154,
  },
});
