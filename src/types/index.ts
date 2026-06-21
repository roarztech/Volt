export type FitnessGoal =
  | 'lose_fat'
  | 'build_muscle'
  | 'recomposition'
  | 'strength'
  | 'general_fitness';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type DietaryPreference =
  | 'balanced'
  | 'high_protein'
  | 'vegetarian'
  | 'vegan'
  | 'low_carb'
  | 'mediterranean';
export type EquipmentOption =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'machines'
  | 'bands'
  | 'full_gym';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  experience: TrainingExperience;
  equipment: EquipmentOption[];
  dietaryPreference: DietaryPreference;
  calorieTarget: number;
  proteinTarget: number;
  createdAt: string;
}

export interface OnboardingInput {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  experience: TrainingExperience;
  equipment: EquipmentOption[];
  dietaryPreference: DietaryPreference;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: EquipmentOption | 'cable' | 'kettlebell';
  targetSets: number;
  targetReps: {
    min: number;
    max: number;
  };
  restSeconds: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  focus: string;
  level: TrainingExperience;
  schedule: string[];
  estimatedMinutes: number;
  exercises: Exercise[];
}

export type SetEffort = 'easy' | 'moderate' | 'hard' | 'failed';

export interface SetEntry {
  id: string;
  reps: number;
  weightKg: number;
  completed: boolean;
  effort: SetEffort;
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  restSeconds: number;
  sets: SetEntry[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  planId?: string;
  planTitle?: string;
  date: string;
  durationMinutes: number;
  perceivedEffort: number;
  exercises: WorkoutExerciseLog[];
  notes?: string;
}

export type FoodPortionMode = 'grams' | 'units';

export interface FoodUnitSize {
  label: 'small' | 'medium' | 'large';
  grams: number;
}

export interface FoodItem {
  id: string;
  name: string;
  serving: string;
  gramsPerServing?: number;
  portionMode?: FoodPortionMode;
  unitLabel?: string;
  unitSizes?: FoodUnitSize[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  date: string;
  mealType: MealType;
  title: string;
  items: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  targetCalories: number;
  targetProtein: number;
}

export interface BodyProgress {
  id: string;
  date: string;
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  photoUri?: string;
  notes?: string;
}

export type CoachMessageRole = 'user' | 'coach';
export type CoachMessageCategory =
  | 'nutrition'
  | 'training'
  | 'recovery'
  | 'consistency'
  | 'progress';

export interface CoachMessage {
  id: string;
  role: CoachMessageRole;
  content: string;
  createdAt: string;
  category?: CoachMessageCategory;
}

export interface AppData {
  profile: UserProfile | null;
  workoutPlans: WorkoutPlan[];
  workoutSessions: WorkoutSession[];
  meals: Meal[];
  foods: FoodItem[];
  bodyProgress: BodyProgress[];
  coachMessages: CoachMessage[];
}
