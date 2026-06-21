import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { LogoMark } from '../components/LogoMark';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { colors, radii, spacing } from '../theme/theme';
import {
  ActivityLevel,
  DietaryPreference,
  EquipmentOption,
  FitnessGoal,
  Gender,
  OnboardingInput,
  TrainingExperience,
} from '../types';

const goalOptions: { label: string; value: FitnessGoal }[] = [
  { label: 'Lose fat', value: 'lose_fat' },
  { label: 'Build muscle', value: 'build_muscle' },
  { label: 'Recomp', value: 'recomposition' },
  { label: 'Strength', value: 'strength' },
  { label: 'Fitness', value: 'general_fitness' },
];

const genderOptions: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const activityOptions: { label: string; value: ActivityLevel }[] = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Active', value: 'active' },
  { label: 'Athlete', value: 'athlete' },
];

const experienceOptions: { label: string; value: TrainingExperience }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const dietaryOptions: { label: string; value: DietaryPreference }[] = [
  { label: 'Balanced', value: 'balanced' },
  { label: 'High protein', value: 'high_protein' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Low carb', value: 'low_carb' },
  { label: 'Mediterranean', value: 'mediterranean' },
];

const equipmentOptions: { label: string; value: EquipmentOption }[] = [
  { label: 'Bodyweight', value: 'bodyweight' },
  { label: 'Dumbbells', value: 'dumbbells' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Machines', value: 'machines' },
  { label: 'Bands', value: 'bands' },
  { label: 'Full gym', value: 'full_gym' },
];

export const OnboardingScreen = () => {
  const { completeOnboarding, useDemoProfile } = useAppState();
  const [name, setName] = useState('');
  const [age, setAge] = useState('29');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('78');
  const [goal, setGoal] = useState<FitnessGoal>('recomposition');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [experience, setExperience] = useState<TrainingExperience>('intermediate');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('high_protein');
  const [equipment, setEquipment] = useState<EquipmentOption[]>(['dumbbells', 'barbell']);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () => name.trim().length > 1 && Number(age) > 12 && Number(heightCm) > 120 && Number(weightKg) > 35,
    [age, heightCm, name, weightKg],
  );

  const toggleEquipment = (value: EquipmentOption) => {
    setEquipment((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const submit = () => {
    if (!canContinue) {
      setError('Add your basics so Volt Beta can calculate realistic targets.');
      return;
    }

    const input: OnboardingInput = {
      name: name.trim(),
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      goal,
      activityLevel,
      experience,
      equipment: equipment.length ? equipment : ['bodyweight'],
      dietaryPreference,
    };

    completeOnboarding(input);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScreen contentStyle={styles.content}>
        <LinearGradient colors={['#191919', '#050505']} style={styles.hero}>
          <View style={styles.brandRow}>
            <LogoMark size={54} animated />
            <AppText variant="caption" color={colors.accent}>
              VOLT AI COACH
            </AppText>
          </View>
          <AppText variant="title">Build your training system.</AppText>
          <AppText variant="body" color={colors.textMuted}>
            Personalized calories, progressive overload, meal targets, and coaching from day one.
          </AppText>
        </LinearGradient>

        <Card style={styles.formCard}>
          <AppText variant="subheading">Profile</AppText>
          <View style={styles.inputGrid}>
            <View style={styles.inputWrap}>
              <AppText variant="caption" color={colors.textMuted}>
                Name
              </AppText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputWrap, styles.rowInput]}>
                <AppText variant="caption" color={colors.textMuted}>
                  Age
                </AppText>
                <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.input} />
              </View>
              <View style={[styles.inputWrap, styles.rowInput]}>
                <AppText variant="caption" color={colors.textMuted}>
                  Height cm
                </AppText>
                <TextInput value={heightCm} onChangeText={setHeightCm} keyboardType="number-pad" style={styles.input} />
              </View>
              <View style={[styles.inputWrap, styles.rowInput]}>
                <AppText variant="caption" color={colors.textMuted}>
                  Weight kg
                </AppText>
                <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" style={styles.input} />
              </View>
            </View>
          </View>

          <OptionGroup title="Gender" options={genderOptions} selected={gender} onSelect={setGender} />
          <OptionGroup title="Goal" options={goalOptions} selected={goal} onSelect={setGoal} />
          <OptionGroup title="Activity" options={activityOptions} selected={activityLevel} onSelect={setActivityLevel} />
          <OptionGroup title="Experience" options={experienceOptions} selected={experience} onSelect={setExperience} />
          <OptionGroup
            title="Diet"
            options={dietaryOptions}
            selected={dietaryPreference}
            onSelect={setDietaryPreference}
          />

          <View style={styles.optionGroup}>
            <AppText variant="caption" color={colors.textMuted}>
              Equipment
            </AppText>
            <View style={styles.pillWrap}>
              {equipmentOptions.map((option) => (
                <Pill
                  key={option.value}
                  label={option.label}
                  selected={equipment.includes(option.value)}
                  onPress={() => toggleEquipment(option.value)}
                />
              ))}
            </View>
          </View>

          {error ? (
            <AppText variant="caption" color={colors.warning}>
              {error}
            </AppText>
          ) : null}

          <PrimaryButton label="Generate profile" onPress={submit} icon={<Sparkles size={18} color={colors.black} />} />
          <PrimaryButton
            label="Explore demo data"
            onPress={useDemoProfile}
            variant="secondary"
            icon={<Dumbbell size={18} color={colors.text} />}
          />
        </Card>
      </AppScreen>
    </KeyboardAvoidingView>
  );
};

const OptionGroup = <T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}) => (
  <View style={styles.optionGroup}>
    <AppText variant="caption" color={colors.textMuted}>
      {title}
    </AppText>
    <View style={styles.pillWrap}>
      {options.map((option) => (
        <Pill
          key={option.value}
          label={option.label}
          selected={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
  },
  hero: {
    minHeight: 244,
    borderRadius: radii.lg,
    padding: spacing.xl,
    justifyContent: 'flex-end',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  formCard: {
    gap: spacing.lg,
  },
  inputGrid: {
    gap: spacing.md,
  },
  inputWrap: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowInput: {
    flex: 1,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
