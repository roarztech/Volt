import {
  ActivityLevel,
  DailyNutrition,
  FitnessGoal,
  FoodItem,
  Meal,
  OnboardingInput,
  UserProfile,
} from '../types';
import { isSameDay, toISODate } from '../utils/date';

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const goalAdjustments: Record<FitnessGoal, number> = {
  lose_fat: -450,
  build_muscle: 250,
  recomposition: -100,
  strength: 150,
  general_fitness: 0,
};

const proteinMultiplier: Record<FitnessGoal, number> = {
  lose_fat: 2.1,
  build_muscle: 2,
  recomposition: 2.1,
  strength: 1.9,
  general_fitness: 1.7,
};

const fallbackServingGrams: Record<string, number> = {
  'food-chicken-rice': 420,
  'food-greek-yogurt': 250,
  'food-protein-oats': 360,
  'food-salmon': 430,
  'food-tofu-bowl': 400,
  'food-shake': 32,
  'catalog-eggs': 50,
  'catalog-banana': 118,
  'catalog-apple': 182,
};

export const calculateNutritionTargets = (input: OnboardingInput) => {
  const genderConstant = input.gender === 'female' ? -161 : 5;
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + genderConstant;
  const maintenanceCalories = bmr * activityMultipliers[input.activityLevel];
  const calorieTarget = Math.max(
    1500,
    Math.round((maintenanceCalories + goalAdjustments[input.goal]) / 25) * 25,
  );
  const proteinTarget = Math.round(input.weightKg * proteinMultiplier[input.goal]);

  return {
    calorieTarget,
    proteinTarget,
  };
};

export const buildUserProfile = (input: OnboardingInput): UserProfile => {
  const targets = calculateNutritionTargets(input);

  return {
    id: `user-${Date.now()}`,
    ...input,
    calorieTarget: targets.calorieTarget,
    proteinTarget: targets.proteinTarget,
    createdAt: new Date().toISOString(),
  };
};

export const getMealsForDate = (meals: Meal[], date = toISODate()) =>
  meals.filter((meal) => isSameDay(meal.date, date));

export const summarizeDailyNutrition = (
  meals: Meal[],
  profile: UserProfile | null,
  date = toISODate(),
): DailyNutrition => {
  const todaysMeals = getMealsForDate(meals, date);

  return todaysMeals.reduce<DailyNutrition>(
    (summary, meal) => ({
      ...summary,
      calories: summary.calories + meal.calories,
      protein: summary.protein + meal.protein,
      carbs: summary.carbs + meal.carbs,
      fats: summary.fats + meal.fats,
    }),
    {
      date,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      targetCalories: profile?.calorieTarget ?? 2200,
      targetProtein: profile?.proteinTarget ?? 160,
    },
  );
};

export const macroPercent = (value: number, target: number) =>
  Math.min(100, Math.max(0, Math.round((value / Math.max(target, 1)) * 100)));

export const getFoodServingGrams = (food: FoodItem) => {
  if (food.gramsPerServing && food.gramsPerServing > 0) {
    return food.gramsPerServing;
  }

  if (fallbackServingGrams[food.id]) {
    return fallbackServingGrams[food.id];
  }

  const gramsFromServing = food.serving.match(/(\d+(?:\.\d+)?)\s*g/i);

  return gramsFromServing ? Number(gramsFromServing[1]) : 100;
};

export const isUnitBasedFood = (food: FoodItem) => food.portionMode === 'units' && Boolean(food.unitSizes?.length);

export const getDefaultUnitSize = (food: FoodItem) =>
  food.unitSizes?.find((size) => size.label === 'medium') ?? food.unitSizes?.[0];

export const getFoodUnitSize = (food: FoodItem, sizeLabel?: string) =>
  food.unitSizes?.find((size) => size.label === sizeLabel) ?? getDefaultUnitSize(food);

export const getDefaultFoodAmount = (food: FoodItem) => (isUnitBasedFood(food) ? 1 : getFoodServingGrams(food));

export const getFoodAmountLabel = (food: FoodItem) => {
  if (!isUnitBasedFood(food)) {
    return 'Quantity grams';
  }

  const unit = food.unitLabel ?? 'item';

  return `How many ${unit}${unit.endsWith('s') ? '' : 's'}`;
};

export const formatFoodAmount = (food: FoodItem, amount: number, sizeLabel?: string) => {
  if (!isUnitBasedFood(food)) {
    return `${amount || getFoodServingGrams(food)} g`;
  }

  const size = getFoodUnitSize(food, sizeLabel);
  const unit = food.unitLabel ?? 'item';
  const cleanAmount = amount || 1;

  return `${cleanAmount} ${size?.label ?? 'medium'} ${unit}${cleanAmount === 1 ? '' : 's'}`;
};

export const calculateFoodPortion = (food: FoodItem, amount: number, sizeLabel?: string) => {
  const baseGrams = getFoodServingGrams(food);
  const portionGrams = isUnitBasedFood(food)
    ? Math.max(0, amount) * (getFoodUnitSize(food, sizeLabel)?.grams ?? baseGrams)
    : Math.max(0, amount);
  const multiplier = portionGrams / Math.max(baseGrams, 1);

  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fats: Math.round(food.fats * multiplier),
  };
};

export const suggestMeals = (profile: UserProfile | null, daily: DailyNutrition) => {
  const remainingCalories = daily.targetCalories - daily.calories;
  const remainingProtein = daily.targetProtein - daily.protein;
  const goal = profile?.goal ?? 'general_fitness';
  const vegetarian = profile?.dietaryPreference === 'vegetarian' || profile?.dietaryPreference === 'vegan';

  if (remainingCalories < 250) {
    return [
      'Greek yogurt with cinnamon',
      vegetarian ? 'Edamame and cucumber bowl' : 'Turkey roll-ups with greens',
      'Protein shake with water',
    ];
  }

  if (remainingProtein > 45) {
    return vegetarian
      ? ['Tofu rice bowl with edamame', 'Lentil pasta with tomato sauce', 'Skyr, berries, and oats']
      : ['Chicken rice bowl with avocado', 'Salmon potatoes and greens', 'Egg white scramble with toast'];
  }

  if (goal === 'lose_fat' || goal === 'recomposition') {
    return ['Big salad with lean protein', 'Tuna potato bowl', 'Cottage cheese, berries, and almonds'];
  }

  if (goal === 'build_muscle' || goal === 'strength') {
    return ['Beef burrito bowl', 'Protein oats with banana', 'Chicken pesto pasta'];
  }

  return ['Mediterranean chicken plate', 'Omelet with fruit', 'Rice bowl with roasted vegetables'];
};
