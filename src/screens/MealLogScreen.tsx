import { Calculator, ChevronDown, ChevronUp, Clock, Flame, Plus, Search, Sparkles, Utensils, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { MotionPressable } from '../components/MotionPressable';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { foodCatalog } from '../data/foodCatalog';
import {
  calculateFoodPortion,
  formatFoodAmount,
  getDefaultFoodAmount,
  getDefaultUnitSize,
  getFoodAmountLabel,
  getMealsForDate,
  isUnitBasedFood,
  suggestMeals,
  summarizeDailyNutrition,
} from '../services/nutrition';
import { colors, radii, spacing } from '../theme/theme';
import { FoodItem, Meal, MealType } from '../types';
import { toISODate } from '../utils/date';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const mealSections: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'snack', label: 'Snacks' },
  { type: 'dinner', label: 'Dinner' },
];

const normalize = (value: string) => value.trim().toLowerCase();

const mergeFoods = (savedFoods: FoodItem[]) => {
  const merged = new Map<string, FoodItem>();

  [...savedFoods, ...foodCatalog].forEach((food) => {
    const key = normalize(food.name);
    const existing = merged.get(key);

    merged.set(key, {
      ...food,
      gramsPerServing: food.gramsPerServing ?? existing?.gramsPerServing,
    });
  });

  return [...merged.values()];
};

const rankFoodMatch = (food: FoodItem, query: string) => {
  const name = normalize(food.name);

  if (!query) {
    return 1;
  }

  if (name === query) {
    return 100;
  }

  if (name.startsWith(query)) {
    return 80;
  }

  if (name.includes(query)) {
    return 60;
  }

  return query
    .split(/\s+/)
    .filter((term) => term.length > 0 && name.includes(term)).length * 20;
};

export const MealLogScreen = () => {
  const { data, addMeal } = useAppState();
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [grams, setGrams] = useState('');
  const [unitSize, setUnitSize] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showFoodLibrary, setShowFoodLibrary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dailyNutrition = useMemo(() => summarizeDailyNutrition(data.meals, data.profile), [data.meals, data.profile]);
  const todaysMeals = useMemo(() => getMealsForDate(data.meals), [data.meals]);
  const groupedTodaysMeals = useMemo(
    () =>
      mealSections
        .map((section) => ({
          ...section,
          meals: todaysMeals.filter((meal) => meal.mealType === section.type),
        }))
        .filter((section) => section.meals.length > 0),
    [todaysMeals],
  );
  const mealSuggestions = suggestMeals(data.profile, dailyNutrition);
  const foodLibrary = useMemo(() => mergeFoods(data.foods), [data.foods]);
  const visibleFoodLibrary = useMemo(
    () => (showFoodLibrary ? foodLibrary.slice(0, 18) : foodLibrary.slice(0, 3)),
    [foodLibrary, showFoodLibrary],
  );
  const foodMatches = useMemo(() => {
    const query = normalize(title);

    if (selectedFood || query.length < 1) {
      return [];
    }

    const rankedFoods = foodLibrary
      .map((food) => ({ food, score: rankFoodMatch(food, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.food)
      .slice(0, 6);

    return rankedFoods.length ? rankedFoods : foodLibrary.slice(0, 6);
  }, [foodLibrary, selectedFood, title]);

  const clearForm = () => {
    setTitle('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setGrams('');
    setUnitSize('');
    setSelectedFood(null);
    setError(null);
  };

  const applyPortion = (food: FoodItem, nextAmount: string, nextUnitSize = unitSize) => {
    const parsedAmount = Number(nextAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      return;
    }

    const portion = calculateFoodPortion(food, parsedAmount, nextUnitSize);

    setCalories(String(portion.calories));
    setProtein(String(portion.protein));
    setCarbs(String(portion.carbs));
    setFats(String(portion.fats));
  };

  const selectFood = (food: FoodItem) => {
    const nextAmount = String(getDefaultFoodAmount(food));
    const nextUnitSize = getDefaultUnitSize(food)?.label ?? '';

    setSelectedFood(food);
    setTitle(food.name);
    setGrams(nextAmount);
    setUnitSize(nextUnitSize);
    applyPortion(food, nextAmount, nextUnitSize);
    setError(null);
  };

  const updateTitle = (value: string) => {
    setTitle(value);

    if (selectedFood && value !== selectedFood.name) {
      setSelectedFood(null);
      setGrams('');
      setUnitSize('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
    }
  };

  const updateAmount = (value: string) => {
    setGrams(value);

    if (selectedFood) {
      applyPortion(selectedFood, value);
    }
  };

  const updateUnitSize = (value: string) => {
    setUnitSize(value);

    if (selectedFood) {
      applyPortion(selectedFood, grams, value);
    }
  };

  const saveManualMeal = () => {
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);

    if (!title.trim() || parsedCalories <= 0 || parsedProtein < 0) {
      setError('Add a meal name plus calories and protein.');
      return;
    }

    addMeal({
      id: `meal-${Date.now()}`,
      date: toISODate(),
      mealType,
      title: title.trim(),
      items: selectedFood
        ? [
            {
              ...selectedFood,
              serving: formatFoodAmount(selectedFood, Number(grams) || getDefaultFoodAmount(selectedFood), unitSize),
              calories: parsedCalories,
              protein: parsedProtein,
              carbs: Number(carbs) || 0,
              fats: Number(fats) || 0,
            },
          ]
        : [],
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
    });
    clearForm();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScreen>
        <AppHeader />

        <Card style={styles.stack}>
          <SectionHeader title="Today" />
          <ProgressBar label="Calories" value={dailyNutrition.calories} target={dailyNutrition.targetCalories} />
          <ProgressBar label="Protein" value={dailyNutrition.protein} target={dailyNutrition.targetProtein} suffix="g" accent={colors.success} />
          <View style={styles.macroRow}>
            <Macro label="Carbs" value={`${dailyNutrition.carbs}g`} />
            <Macro label="Fats" value={`${dailyNutrition.fats}g`} />
          </View>
        </Card>

        <Card style={styles.stack}>
          <SectionHeader title="Log Meal" />
          <View style={styles.inputWrap}>
            <AppText variant="caption" color={colors.textMuted}>
              Meal
            </AppText>
            <TextInput
              value={title}
              onChangeText={updateTitle}
              placeholder="Chicken bowl, protein oats..."
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
          </View>
          {!selectedFood && title.trim().length ? (
            <View style={styles.matchPanel}>
              <View style={styles.matchHeader}>
                <Search size={16} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textMuted}>
                  FOOD MATCHES
                </AppText>
              </View>
              {foodMatches.map((food) => (
                <MotionPressable key={food.id} style={styles.foodSuggestion} onPress={() => selectFood(food)}>
                  <View style={styles.suggestionIcon}>
                    <Search size={15} color={colors.textMuted} />
                  </View>
                  <View style={styles.foodText}>
                    <AppText variant="body">{food.name}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {food.serving} - {food.calories} kcal - {food.protein}g protein
                    </AppText>
                  </View>
                </MotionPressable>
              ))}
            </View>
          ) : null}
          {selectedFood ? (
            <View style={styles.selectedFood}>
              <View style={styles.selectedFoodCopy}>
                <AppText variant="caption" color={colors.textMuted}>
                  SELECTED FOOD
                </AppText>
                <AppText variant="body">{selectedFood.name}</AppText>
              </View>
              <MotionPressable style={styles.clearFoodButton} onPress={clearForm} activeScale={0.9}>
                <X size={16} color={colors.text} />
              </MotionPressable>
            </View>
          ) : null}
          <View style={styles.pillWrap}>
            {mealTypes.map((type) => (
              <Pill key={type} label={type} selected={mealType === type} onPress={() => setMealType(type)} />
            ))}
          </View>
          {selectedFood ? (
            <View style={styles.portionPanel}>
              <View style={styles.portionHeader}>
                <Calculator size={18} color={colors.gold} />
                <AppText variant="caption" color={colors.textMuted}>
                  {isUnitBasedFood(selectedFood) ? 'AUTO MACROS FROM COUNT' : 'AUTO MACROS FROM GRAMS'}
                </AppText>
              </View>
              <View style={styles.inputWrap}>
                <AppText variant="caption" color={colors.textMuted}>
                  {getFoodAmountLabel(selectedFood)}
                </AppText>
                <TextInput
                  value={grams}
                  onChangeText={updateAmount}
                  keyboardType={isUnitBasedFood(selectedFood) ? 'number-pad' : 'decimal-pad'}
                  placeholder={`${getDefaultFoodAmount(selectedFood)}`}
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                />
              </View>
              {isUnitBasedFood(selectedFood) && selectedFood.unitSizes?.length ? (
                <View style={styles.sizeWrap}>
                  <AppText variant="caption" color={colors.textMuted}>
                    Size
                  </AppText>
                  <View style={styles.pillWrap}>
                    {selectedFood.unitSizes.map((size) => (
                      <Pill
                        key={size.label}
                        label={size.label}
                        selected={unitSize === size.label}
                        onPress={() => updateUnitSize(size.label)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <View style={styles.previewGrid}>
                <PreviewMacro label="Calories" value={calories || '0'} />
                <PreviewMacro label="Protein" value={`${protein || '0'}g`} />
                <PreviewMacro label="Carbs" value={`${carbs || '0'}g`} />
                <PreviewMacro label="Fats" value={`${fats || '0'}g`} />
              </View>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <MacroInput label="Calories" value={calories} onChangeText={setCalories} locked={!!selectedFood} />
            <MacroInput label="Protein" value={protein} onChangeText={setProtein} locked={!!selectedFood} />
          </View>
          <View style={styles.inputRow}>
            <MacroInput label="Carbs" value={carbs} onChangeText={setCarbs} locked={!!selectedFood} />
            <MacroInput label="Fats" value={fats} onChangeText={setFats} locked={!!selectedFood} />
          </View>
          {error ? (
            <AppText variant="caption" color={colors.warning}>
              {error}
            </AppText>
          ) : null}
          <PrimaryButton label="Save meal" onPress={saveManualMeal} icon={<Plus size={18} color={colors.black} />} />
        </Card>

        <Card style={styles.stack}>
          <SectionHeader title="Coach Suggestions" />
          {mealSuggestions.map((suggestion) => (
            <View key={suggestion} style={styles.suggestion}>
              <Sparkles size={17} color={colors.accent} />
              <AppText variant="body" style={styles.suggestionText}>
                {suggestion}
              </AppText>
            </View>
          ))}
        </Card>

        <Card style={styles.foodLibraryCard}>
          <View style={styles.libraryTop}>
            <View>
              <AppText variant="caption" color={colors.textMuted}>
                QUICK PICKS
              </AppText>
              <AppText variant="subheading">Food suggestions</AppText>
            </View>
            <MotionPressable style={[styles.libraryToggle, showFoodLibrary && styles.libraryToggleActive]} onPress={() => setShowFoodLibrary((current) => !current)}>
              <AppText variant="caption" color={showFoodLibrary ? colors.black : colors.text}>
                {showFoodLibrary ? 'LESS' : 'MORE'}
              </AppText>
              {showFoodLibrary ? (
                <ChevronUp size={16} color={colors.black} />
              ) : (
                <ChevronDown size={16} color={colors.text} />
              )}
            </MotionPressable>
          </View>
          <View style={styles.foodTileGrid}>
            {visibleFoodLibrary.map((food) => (
              <FoodTile key={food.id} food={food} onPress={() => selectFood(food)} />
            ))}
          </View>
          {!showFoodLibrary ? (
            <AppText variant="caption" color={colors.textMuted}>
              Search above or tap More to open the full local food catalog.
            </AppText>
          ) : null}
        </Card>

        <SectionHeader title="Logged Today" />
        {todaysMeals.length ? (
          <Card style={styles.loggedPanel}>
            <View style={styles.loggedTop}>
              <View style={styles.loggedIcon}>
                <Utensils size={20} color={colors.black} />
              </View>
              <View style={styles.loggedCopy}>
                <AppText variant="caption" color={colors.textMuted}>
                  TODAY'S INTAKE
                </AppText>
                <AppText variant="subheading">{todaysMeals.length} meals logged</AppText>
              </View>
              <View style={styles.calorieBadge}>
                <Flame size={15} color={colors.gold} />
                <AppText variant="caption">{dailyNutrition.calories}</AppText>
              </View>
            </View>
            <View style={styles.loggedMacroRow}>
              <MacroPill label="Protein" value={`${dailyNutrition.protein}g`} accent={colors.success} />
              <MacroPill label="Carbs" value={`${dailyNutrition.carbs}g`} accent={colors.blue} />
              <MacroPill label="Fats" value={`${dailyNutrition.fats}g`} accent={colors.gold} />
            </View>
            <View style={styles.mealTimeline}>
              {groupedTodaysMeals.map((section) => (
                <MealGroup key={section.type} label={section.label} meals={section.meals} />
              ))}
            </View>
          </Card>
        ) : (
          <Card>
            <EmptyState title="No meals today" body="Log a meal or tap a food suggestion to start the day." icon={<Utensils color={colors.accent} />} />
          </Card>
        )}
      </AppScreen>
    </KeyboardAvoidingView>
  );
};

const FoodTile = ({ food, onPress }: { food: FoodItem; onPress: () => void }) => (
  <MotionPressable style={styles.foodTile} onPress={onPress}>
    <View style={styles.foodTileTop}>
      <View style={styles.foodTileIcon}>
        <Plus size={15} color={colors.black} />
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        {food.calories} kcal
      </AppText>
    </View>
    <AppText variant="body" numberOfLines={1}>
      {food.name}
    </AppText>
    <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
      {food.serving} - {food.protein}g protein
    </AppText>
  </MotionPressable>
);

const MealGroup = ({ label, meals }: { label: string; meals: Meal[] }) => {
  const calories = meals.reduce((total, meal) => total + meal.calories, 0);
  const protein = meals.reduce((total, meal) => total + meal.protein, 0);

  return (
    <View style={styles.mealGroup}>
      <View style={styles.mealGroupHeader}>
        <View>
          <AppText variant="caption" color={colors.textMuted}>
            {label.toUpperCase()}
          </AppText>
          <AppText variant="body">
            {meals.length} item{meals.length > 1 ? 's' : ''}
          </AppText>
        </View>
        <View style={styles.mealGroupTotals}>
          <AppText variant="caption">{calories} kcal</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {protein}g protein
          </AppText>
        </View>
      </View>
      <View style={styles.mealGroupRows}>
        {meals.map((meal, index) => (
          <LoggedMeal key={meal.id} meal={meal} index={index} />
        ))}
      </View>
    </View>
  );
};

const LoggedMeal = ({ meal, index }: { meal: Meal; index: number }) => (
  <View style={styles.loggedMeal}>
    <View style={styles.timelineRail}>
      <View style={styles.timelineDot}>
        <AppText variant="caption" color={colors.black}>
          {index + 1}
        </AppText>
      </View>
      <View style={styles.timelineLine} />
    </View>
    <View style={styles.loggedMealBody}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleWrap}>
          <AppText variant="body" numberOfLines={1}>
            {meal.title}
          </AppText>
          <View style={styles.mealMetaRow}>
            <Clock size={13} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textMuted}>
              {meal.items[0]?.serving ?? 'Logged today'}
            </AppText>
          </View>
        </View>
        <View style={styles.mealCalories}>
          <AppText variant="subheading">{meal.calories}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            kcal
          </AppText>
        </View>
      </View>
      <View style={styles.mealMacroRow}>
        <TinyMacro label="P" value={`${meal.protein}g`} />
        <TinyMacro label="C" value={`${meal.carbs}g`} />
        <TinyMacro label="F" value={`${meal.fats}g`} />
      </View>
    </View>
  </View>
);

const MacroPill = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <View style={styles.macroPill}>
    <View style={[styles.macroPillLine, { backgroundColor: accent }]} />
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="body">{value}</AppText>
  </View>
);

const TinyMacro = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.tinyMacro}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="caption">{value}</AppText>
  </View>
);

const MacroInput = ({
  label,
  value,
  onChangeText,
  locked = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  locked?: boolean;
}) => (
  <View style={styles.inputWrap}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      editable={!locked}
      style={[styles.input, locked && styles.lockedInput]}
    />
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

const PreviewMacro = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.previewMacro}>
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
  stack: {
    gap: spacing.lg,
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
  lockedInput: {
    color: colors.textMuted,
    backgroundColor: colors.graphite,
  },
  matchPanel: {
    gap: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  foodSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
  },
  selectedFoodCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  clearFoodButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionPanel: {
    gap: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
  },
  portionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeWrap: {
    gap: spacing.sm,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewMacro: {
    flex: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
  suggestion: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
  },
  suggestionText: {
    flex: 1,
  },
  foodLibraryCard: {
    gap: spacing.lg,
  },
  libraryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  libraryToggle: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  libraryToggleActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  foodTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  foodTile: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  foodTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  foodTileIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  foodText: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedPanel: {
    gap: spacing.lg,
  },
  loggedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loggedIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  calorieBadge: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loggedMacroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroPill: {
    flex: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  macroPillLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  mealTimeline: {
    gap: spacing.md,
  },
  mealGroup: {
    gap: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mealGroupTotals: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mealGroupRows: {
    gap: spacing.md,
  },
  loggedMeal: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 1,
    minHeight: 42,
    backgroundColor: colors.cardBorder,
    marginTop: spacing.sm,
  },
  loggedMealBody: {
    flex: 1,
    gap: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  mealCard: {
    gap: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  mealMacroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tinyMacro: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
