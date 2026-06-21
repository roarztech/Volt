import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createDemoData, demoProfile } from '../data/demoData';
import { generateCoachReply } from '../services/coachService';
import { buildUserProfile } from '../services/nutrition';
import { localAppDataStore } from '../services/storage';
import { AppData, BodyProgress, CoachMessage, Meal, OnboardingInput, UserProfile, WorkoutSession } from '../types';

interface AppStateContextValue {
  data: AppData;
  hydrated: boolean;
  coachThinking: boolean;
  error: string | null;
  completeOnboarding: (input: OnboardingInput) => void;
  useDemoProfile: () => void;
  updateProfile: (profile: UserProfile) => void;
  addWorkoutSession: (session: WorkoutSession) => void;
  addMeal: (meal: Meal) => void;
  addBodyProgress: (entry: BodyProgress) => void;
  sendCoachMessage: (content: string) => void;
  resetApp: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(() => createDemoData(null));
  const [hydrated, setHydrated] = useState(false);
  const [coachThinking, setCoachThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coachReplyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    localAppDataStore
      .load()
      .then((stored) => {
        if (mounted && stored) {
          setData(stored);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Volt could not load local data, so demo data was restored.');
        }
      })
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localAppDataStore.save(data).catch(() => {
      setError('Volt could not save the latest change locally.');
    });
  }, [data, hydrated]);

  useEffect(
    () => () => {
      if (coachReplyTimeout.current) {
        clearTimeout(coachReplyTimeout.current);
      }
    },
    [],
  );

  const completeOnboarding = useCallback((input: OnboardingInput) => {
    const profile = buildUserProfile(input);
    setData(createDemoData(profile));
  }, []);

  const useDemoProfile = useCallback(() => {
    setData(createDemoData(demoProfile));
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    setData((current) => ({ ...current, profile }));
  }, []);

  const addWorkoutSession = useCallback((session: WorkoutSession) => {
    setData((current) => ({
      ...current,
      workoutSessions: [...current.workoutSessions, session],
    }));
  }, []);

  const addMeal = useCallback((meal: Meal) => {
    setData((current) => ({
      ...current,
      meals: [...current.meals, meal],
    }));
  }, []);

  const addBodyProgress = useCallback((entry: BodyProgress) => {
    setData((current) => ({
      ...current,
      bodyProgress: [...current.bodyProgress, entry],
    }));
  }, []);

  const sendCoachMessage = useCallback((content: string) => {
    if (coachThinking) {
      return;
    }

    const userMessage: CoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setCoachThinking(true);
    setData((current) => ({
      ...current,
      coachMessages: [...current.coachMessages, userMessage],
    }));

    coachReplyTimeout.current = setTimeout(() => {
      setData((current) => {
        const coachMessage = generateCoachReply(content, current);

        return {
          ...current,
          coachMessages: [...current.coachMessages, coachMessage],
        };
      });
      setCoachThinking(false);
      coachReplyTimeout.current = null;
    }, 950);
  }, [coachThinking]);

  const resetApp = useCallback(async () => {
    await localAppDataStore.clear();
    setData(createDemoData(null));
    setError(null);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      data,
      hydrated,
      coachThinking,
      error,
      completeOnboarding,
      useDemoProfile,
      updateProfile,
      addWorkoutSession,
      addMeal,
      addBodyProgress,
      sendCoachMessage,
      resetApp,
    }),
    [
      addBodyProgress,
      addMeal,
      addWorkoutSession,
      completeOnboarding,
      data,
      error,
      hydrated,
      coachThinking,
      resetApp,
      sendCoachMessage,
      updateProfile,
      useDemoProfile,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }

  return context;
};
