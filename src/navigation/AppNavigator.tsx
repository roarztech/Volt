import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bot, CalendarDays, Dumbbell, Home, TrendingUp, Utensils } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, View } from 'react-native';
import { LogoMark } from '../components/LogoMark';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { AICoachScreen } from '../screens/AICoachScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MealLogScreen } from '../screens/MealLogScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { colors, radii, spacing } from '../theme/theme';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const useNativeMotion = Platform.OS !== 'web';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.backgroundElevated,
    text: colors.text,
    border: colors.cardBorder,
    primary: colors.accent,
    notification: colors.accent,
  },
};

const tabIcons = {
  Dashboard: Home,
  Workouts: Dumbbell,
  Meals: Utensils,
  Progress: TrendingUp,
  History: CalendarDays,
  Coach: Bot,
};

const TabIcon = ({
  Icon,
  color,
  focused,
}: {
  Icon: typeof Home;
  color: string;
  focused: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused) {
      return;
    }

    scale.stopAnimation();
    scale.setValue(0.88);
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.12,
        damping: 9,
        stiffness: 420,
        mass: 0.35,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 300,
        mass: 0.45,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  }, [focused, scale]);

  return (
    <Animated.View style={[styles.tabIconMotion, { transform: [{ scale }] }]}>
      <View style={[styles.tabIconShell, focused && styles.tabIconShellActive]}>
        {focused ? (
          <LinearGradient
            colors={['#FFFFFF', '#D8D8D2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabIconGradient}
          >
            <Icon size={19} color={colors.black} strokeWidth={2.6} />
          </LinearGradient>
        ) : (
          <Icon size={20} color={color} strokeWidth={2.2} />
        )}
      </View>
    </Animated.View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const Icon = tabIcons[route.name];

      return {
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#15171B', '#08090B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBarBackground}
          />
        ),
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Icon} color={color} focused={focused} />,
      };
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Workouts" component={WorkoutScreen} />
    <Tab.Screen name="Meals" component={MealLogScreen} />
    <Tab.Screen name="Progress" component={ProgressScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Coach" component={AICoachScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { data, hydrated } = useAppState();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <LogoMark size={78} animated />
        <ActivityIndicator color={colors.accent} size="large" />
        <AppText variant="caption" color={colors.textMuted}>
          LOADING VOLT
        </AppText>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!data.profile ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  tabBar: {
    position: 'absolute',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 74,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#383B42',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 16,
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.md,
  },
  tabItem: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
  tabIconMotion: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconShell: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconShellActive: {
    transform: [{ translateY: -1 }],
  },
  tabIconGradient: {
    width: 32,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
