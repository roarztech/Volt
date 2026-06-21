import { Exercise, SetEntry, WorkoutSession } from '../types';
import { isWithinLastDays } from '../utils/date';

export interface OverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  headline: string;
  detail: string;
  nextSets: number;
  nextReps: number;
  nextWeightKg: number;
  tone: 'increase' | 'hold' | 'reduce';
}

export interface PersonalRecord {
  exerciseName: string;
  bestWeightKg: number;
  bestVolume: number;
  date: string;
}

const getCompletedSets = (sets: SetEntry[]) => sets.filter((set) => set.completed);

export const calculateSessionVolume = (session: WorkoutSession) =>
  session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce((setTotal, set) => setTotal + (set.completed ? set.reps * set.weightKg : 0), 0),
    0,
  );

export const getWeeklyVolume = (sessions: WorkoutSession[]) =>
  sessions
    .filter((session) => isWithinLastDays(session.date, 7))
    .reduce((total, session) => total + calculateSessionVolume(session), 0);

export const getWeeklyWorkoutCount = (sessions: WorkoutSession[]) =>
  sessions.filter((session) => isWithinLastDays(session.date, 7)).length;

export const getConsistencyPercent = (sessions: WorkoutSession[], weeklyGoal = 4) =>
  Math.min(100, Math.round((getWeeklyWorkoutCount(sessions) / weeklyGoal) * 100));

export const getLatestExerciseLog = (exercise: Exercise, sessions: WorkoutSession[]) => {
  const logs = sessions
    .flatMap((session) =>
      session.exercises
        .filter((entry) => entry.exerciseId === exercise.id || entry.exerciseName === exercise.name)
        .map((entry) => ({ session, entry })),
    )
    .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime());

  return logs[0];
};

export const generateOverloadSuggestion = (
  exercise: Exercise,
  sessions: WorkoutSession[],
): OverloadSuggestion => {
  const latest = getLatestExerciseLog(exercise, sessions);

  if (!latest) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      headline: 'Establish a baseline',
      detail: `Start with ${exercise.targetSets} sets of ${exercise.targetReps.min}-${exercise.targetReps.max} and leave 2 reps in reserve.`,
      nextSets: exercise.targetSets,
      nextReps: exercise.targetReps.min,
      nextWeightKg: 0,
      tone: 'hold',
    };
  }

  const completedSets = getCompletedSets(latest.entry.sets);
  const topWeight = Math.max(...completedSets.map((set) => set.weightKg), 0);
  const averageReps =
    completedSets.reduce((total, set) => total + set.reps, 0) / Math.max(completedSets.length, 1);
  const allSetsHit =
    completedSets.length >= exercise.targetSets &&
    completedSets.every((set) => set.reps >= exercise.targetReps.min);
  const easySets = completedSets.filter((set) => set.effort === 'easy').length;
  const failedSets = latest.entry.sets.filter((set) => set.effort === 'failed' || !set.completed).length;
  const hardSets = completedSets.filter((set) => set.effort === 'hard').length;
  const weightJump = topWeight >= 60 ? 5 : 2.5;

  // Progressive overload is intentionally conservative: the app only pushes load
  // when the user hit the prescribed work and reported enough control.
  if (failedSets > 0 || completedSets.length < Math.max(1, exercise.targetSets - 1)) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      headline: 'Reduce the pressure',
      detail: `Keep technique crisp next time: ${Math.max(2, completedSets.length)} sets around ${Math.max(
        exercise.targetReps.min - 1,
        Math.round(averageReps),
      )} reps at ${topWeight} kg.`,
      nextSets: Math.max(2, completedSets.length),
      nextReps: Math.max(exercise.targetReps.min - 1, Math.round(averageReps)),
      nextWeightKg: topWeight,
      tone: 'reduce',
    };
  }

  if (allSetsHit && easySets >= Math.ceil(completedSets.length / 2)) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      headline: 'Add load next time',
      detail: `You owned the target. Try ${topWeight + weightJump} kg for ${exercise.targetSets} x ${
        exercise.targetReps.min
      } and keep 1-2 reps in reserve.`,
      nextSets: exercise.targetSets,
      nextReps: exercise.targetReps.min,
      nextWeightKg: topWeight + weightJump,
      tone: 'increase',
    };
  }

  if (allSetsHit && hardSets === 0) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      headline: 'Add a rep before load',
      detail: `Hold ${topWeight} kg and push toward ${Math.min(
        exercise.targetReps.max,
        Math.round(averageReps) + 1,
      )} reps per set.`,
      nextSets: exercise.targetSets,
      nextReps: Math.min(exercise.targetReps.max, Math.round(averageReps) + 1),
      nextWeightKg: topWeight,
      tone: 'increase',
    };
  }

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    headline: 'Hold and consolidate',
    detail: `Repeat ${topWeight} kg for ${exercise.targetSets} sets until the last set feels smoother.`,
    nextSets: exercise.targetSets,
    nextReps: Math.max(exercise.targetReps.min, Math.round(averageReps)),
    nextWeightKg: topWeight,
    tone: 'hold',
  };
};

export const getPersonalRecords = (sessions: WorkoutSession[]): PersonalRecord[] => {
  const records = new Map<string, PersonalRecord>();

  sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const bestWeightKg = Math.max(...exercise.sets.filter((set) => set.completed).map((set) => set.weightKg), 0);
      const bestVolume = exercise.sets.reduce(
        (total, set) => total + (set.completed ? set.reps * set.weightKg : 0),
        0,
      );
      const existing = records.get(exercise.exerciseName);

      if (!existing || bestWeightKg > existing.bestWeightKg || bestVolume > existing.bestVolume) {
        records.set(exercise.exerciseName, {
          exerciseName: exercise.exerciseName,
          bestWeightKg,
          bestVolume,
          date: session.date,
        });
      }
    });
  });

  return Array.from(records.values()).sort((a, b) => b.bestVolume - a.bestVolume);
};
