import { AppData, CoachMessage, CoachMessageCategory } from '../types';
import { summarizeDailyNutrition } from './nutrition';
import { generateOverloadSuggestion, getWeeklyWorkoutCount } from './recommendations';

const classifyPrompt = (prompt: string): CoachMessageCategory => {
  const text = prompt.toLowerCase();

  if (text.includes('meal') || text.includes('calorie') || text.includes('protein') || text.includes('macro')) {
    return 'nutrition';
  }

  if (text.includes('sleep') || text.includes('sore') || text.includes('recovery') || text.includes('rest')) {
    return 'recovery';
  }

  if (text.includes('weight') || text.includes('fat') || text.includes('muscle') || text.includes('progress')) {
    return 'progress';
  }

  if (text.includes('motivation') || text.includes('consistent') || text.includes('streak')) {
    return 'consistency';
  }

  return 'training';
};

export const generateCoachReply = (prompt: string, data: AppData): CoachMessage => {
  const category = classifyPrompt(prompt);
  const profile = data.profile;
  const nutrition = summarizeDailyNutrition(data.meals, profile);
  const firstExercise = data.workoutPlans[0]?.exercises[0];
  const suggestion = firstExercise ? generateOverloadSuggestion(firstExercise, data.workoutSessions) : null;
  const workoutsThisWeek = getWeeklyWorkoutCount(data.workoutSessions);
  const latestWeight = data.bodyProgress.at(-1)?.weightKg ?? profile?.weightKg;
  const name = profile?.name?.split(' ')[0] ?? 'there';

  let content = `I have you, ${name}. `;

  if (category === 'nutrition') {
    const remainingProtein = Math.max(0, nutrition.targetProtein - nutrition.protein);
    const remainingCalories = Math.max(0, nutrition.targetCalories - nutrition.calories);
    content += `Today you have about ${remainingCalories} calories and ${remainingProtein} g protein left. Prioritize a lean protein anchor, then add carbs around training if energy feels low.`;
  } else if (category === 'recovery') {
    content += `Recovery is part of the plan. If soreness is above a 7/10, keep the session but reduce load by 5-10%, extend warmups, and chase clean reps instead of fatigue.`;
  } else if (category === 'progress') {
    content += `Your latest logged weight is ${latestWeight ?? '--'} kg. Judge the trend across 2-3 weeks, not a single weigh-in. For ${profile?.goal.replace('_', ' ') ?? 'your goal'}, consistency beats aggressive swings.`;
  } else if (category === 'consistency') {
    content += `You have ${workoutsThisWeek} workouts logged this week. Make the next action small: train, log one meal, or take a weigh-in. Momentum compounds when the bar is clear.`;
  } else {
    content += suggestion
      ? `${suggestion.exerciseName}: ${suggestion.headline.toLowerCase()}. ${suggestion.detail}`
      : 'Start with controlled sets, log effort honestly, and I will shape the next target from your performance.';
  }

  return {
    id: `coach-${Date.now()}`,
    role: 'coach',
    content,
    category,
    createdAt: new Date().toISOString(),
  };
};
