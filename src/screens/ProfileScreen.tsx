import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Camera, Check, Edit3, RotateCcw, ShieldCheck, X, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { LogoMark } from '../components/LogoMark';
import { MotionPressable } from '../components/MotionPressable';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { RootStackParamList } from '../navigation/types';
import { calculateNutritionTargets } from '../services/nutrition';
import { colors, radii, spacing } from '../theme/theme';
import {
  ActivityLevel,
  DietaryPreference,
  FitnessGoal,
  Gender,
  TrainingExperience,
  UserProfile,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const goalLabels: Record<FitnessGoal, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  recomposition: 'Recomposition',
  strength: 'Strength',
  general_fitness: 'General fitness',
};

const genderOptions: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const goalOptions: { label: string; value: FitnessGoal }[] = [
  { label: 'Lose fat', value: 'lose_fat' },
  { label: 'Build muscle', value: 'build_muscle' },
  { label: 'Recomp', value: 'recomposition' },
  { label: 'Strength', value: 'strength' },
  { label: 'Fitness', value: 'general_fitness' },
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

type ProfileForm = {
  name: string;
  age: string;
  gender: Gender;
  heightCm: string;
  weightKg: string;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  experience: TrainingExperience;
  dietaryPreference: DietaryPreference;
};

const createForm = (profile: UserProfile): ProfileForm => ({
  name: profile.name,
  age: String(profile.age),
  gender: profile.gender,
  heightCm: String(profile.heightCm),
  weightKg: String(profile.weightKg),
  goal: profile.goal,
  activityLevel: profile.activityLevel,
  experience: profile.experience,
  dietaryPreference: profile.dietaryPreference,
});

export const ProfileScreen = ({ navigation }: Props) => {
  const { data, resetApp, useDemoProfile, updateProfile } = useAppState();
  const profile = data.profile;
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(profile ? createForm(profile) : null);

  useEffect(() => {
    if (profile && !isEditing) {
      setForm(createForm(profile));
    }
  }, [isEditing, profile]);

  const confirmReset = () => {
    Alert.alert('Reset Volt Beta?', 'This clears local app data and returns to onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetApp();
          navigation.goBack();
        },
      },
    ]);
  };

  const setFormValue = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const cancelEdit = () => {
    if (profile) {
      setForm(createForm(profile));
    }
    setError(null);
    setIsEditing(false);
  };

  const saveProfile = () => {
    if (!profile || !form) {
      return;
    }

    const age = Number(form.age);
    const heightCm = Number(form.heightCm);
    const weightKg = Number(form.weightKg);

    if (!form.name.trim() || age < 13 || heightCm < 120 || weightKg < 35) {
      setError('Add a valid name, age, height, and weight before saving.');
      return;
    }

    const nextProfileBase = {
      ...profile,
      name: form.name.trim(),
      age,
      gender: form.gender,
      heightCm,
      weightKg,
      goal: form.goal,
      activityLevel: form.activityLevel,
      experience: form.experience,
      dietaryPreference: form.dietaryPreference,
    };
    const targets = calculateNutritionTargets(nextProfileBase);

    updateProfile({
      ...nextProfileBase,
      calorieTarget: targets.calorieTarget,
      proteinTarget: targets.proteinTarget,
    });
    setError(null);
    setIsEditing(false);
  };

  if (!profile || !form) {
    return (
      <AppScreen>
        <Card style={styles.stack}>
          <AppText variant="heading">No profile yet</AppText>
          <PrimaryButton label="Load demo profile" onPress={useDemoProfile} />
        </Card>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MotionPressable style={styles.backButton} onPress={() => navigation.goBack()} activeScale={0.94}>
            <ArrowLeft size={21} color={colors.text} />
          </MotionPressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" color={colors.textMuted}>
              PROFILE
            </AppText>
            <AppText variant="heading" numberOfLines={1}>
              {profile.name}
            </AppText>
          </View>
        </View>
        <LogoMark size={48} animated />
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Camera size={26} color={colors.textMuted} />
          </View>
          <View style={styles.avatarCopy}>
            <AppText variant="subheading">{profile.name}</AppText>
            <AppText variant="body" color={colors.textMuted}>
              Profile photo placeholder
            </AppText>
          </View>
        </View>
        <View style={styles.actionRow}>
          {isEditing ? (
            <>
              <PrimaryButton
                label="Save changes"
                onPress={saveProfile}
                icon={<Check size={18} color={colors.black} />}
                style={styles.actionButton}
              />
              <PrimaryButton
                label="Cancel"
                onPress={cancelEdit}
                variant="secondary"
                icon={<X size={18} color={colors.text} />}
                style={styles.actionButton}
              />
            </>
          ) : (
            <PrimaryButton
              label="Edit profile"
              onPress={() => setIsEditing(true)}
              icon={<Edit3 size={18} color={colors.black} />}
              style={styles.fullButton}
            />
          )}
        </View>
        {error ? (
          <AppText variant="caption" color={colors.warning}>
            {error}
          </AppText>
        ) : null}
      </Card>

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              GOAL
            </AppText>
            <AppText variant="heading">{goalLabels[profile.goal]}</AppText>
          </View>
          <Zap size={28} color={colors.accent} />
        </View>
        <View style={styles.statRow}>
          <ProfileStat label="Calories" value={`${profile.calorieTarget}`} />
          <ProfileStat label="Protein" value={`${profile.proteinTarget}g`} />
          <ProfileStat label="Weight" value={`${profile.weightKg}kg`} />
        </View>
      </Card>

      {isEditing ? (
        <Card style={styles.stack}>
          <SectionHeader title="Update Stats" />
          <View style={styles.inputWrap}>
            <AppText variant="caption" color={colors.textMuted}>
              Name
            </AppText>
            <TextInput value={form.name} onChangeText={(value) => setFormValue('name', value)} style={styles.input} />
          </View>
          <View style={styles.inputRow}>
            <ProfileInput label="Age" value={form.age} onChangeText={(value) => setFormValue('age', value)} />
            <ProfileInput label="Height cm" value={form.heightCm} onChangeText={(value) => setFormValue('heightCm', value)} />
            <ProfileInput label="Weight kg" value={form.weightKg} onChangeText={(value) => setFormValue('weightKg', value)} />
          </View>
          <OptionGroup title="Gender" options={genderOptions} selected={form.gender} onSelect={(value) => setFormValue('gender', value)} />
          <OptionGroup title="Goal" options={goalOptions} selected={form.goal} onSelect={(value) => setFormValue('goal', value)} />
          <OptionGroup
            title="Activity"
            options={activityOptions}
            selected={form.activityLevel}
            onSelect={(value) => setFormValue('activityLevel', value)}
          />
          <OptionGroup
            title="Experience"
            options={experienceOptions}
            selected={form.experience}
            onSelect={(value) => setFormValue('experience', value)}
          />
          <OptionGroup
            title="Diet"
            options={dietaryOptions}
            selected={form.dietaryPreference}
            onSelect={(value) => setFormValue('dietaryPreference', value)}
          />
        </Card>
      ) : (
        <Card style={styles.stack}>
          <SectionHeader title="Basics" />
          <Detail label="Age" value={`${profile.age}`} />
          <Detail label="Gender" value={profile.gender.replaceAll('_', ' ')} />
          <Detail label="Height" value={`${profile.heightCm} cm`} />
          <Detail label="Activity" value={profile.activityLevel} />
          <Detail label="Experience" value={profile.experience} />
          <Detail label="Diet" value={profile.dietaryPreference.replaceAll('_', ' ')} />
        </Card>
      )}

      <Card style={styles.stack}>
        <SectionHeader title="Equipment" />
        <View style={styles.pillWrap}>
          {profile.equipment.map((item) => (
            <Pill key={item} label={item.replaceAll('_', ' ')} selected />
          ))}
        </View>
      </Card>

      <Card style={styles.stack}>
        <View style={styles.secureRow}>
          <View style={styles.secureIcon}>
            <ShieldCheck size={20} color={colors.success} />
          </View>
          <View style={styles.secureText}>
            <AppText variant="body">Local data store active</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {data.workoutSessions.length} workouts, {data.meals.length} meals, {data.bodyProgress.length} check-ins
            </AppText>
          </View>
        </View>
        <PrimaryButton
          label="Reset onboarding"
          onPress={confirmReset}
          variant="secondary"
          icon={<RotateCcw size={18} color={colors.text} />}
        />
      </Card>
    </AppScreen>
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
        <Pill key={option.value} label={option.label} selected={selected === option.value} onPress={() => onSelect(option.value)} />
      ))}
    </View>
  </View>
);

const ProfileInput = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) => (
  <View style={styles.inputWrap}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.input} />
  </View>
);

const ProfileStat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.profileStat}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="subheading">{value}</AppText>
  </View>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detail}>
    <AppText variant="caption" color={colors.textMuted}>
      {label}
    </AppText>
    <AppText variant="body" style={styles.detailValue}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
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
  headerCopy: {
    flex: 1,
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
  profileCard: {
    gap: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
  hero: {
    gap: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileStat: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundElevated,
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
  optionGroup: {
    gap: spacing.sm,
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailValue: {
    textTransform: 'capitalize',
    textAlign: 'right',
    flex: 1,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  secureIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#102E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: {
    flex: 1,
  },
});
