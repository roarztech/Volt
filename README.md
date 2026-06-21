# Volt

Volt is a premium mobile-first AI fitness coach built with Expo, React Native, and TypeScript. It helps users track workouts, nutrition, body progress, progressive overload, and coaching conversations in one clean dark-mode experience.

## Highlights

- **Onboarding profile builder** for goal, activity level, training experience, equipment, diet, body stats, and targets.
- **Dashboard command center** with daily nutrition, protein, body weight, training load, readiness, and coach signals.
- **Workout tracking** with plans, exercise sets, reps, weight, effort, rest time, notes, history, PRs, and progressive overload suggestions.
- **Meal tracking** with searchable food suggestions, gram-based portions, unit-based portions for foods like eggs, macro auto-calculation, and meals grouped by breakfast, lunch, snacks, and dinner.
- **AI coach chat** with rule-based simulated coaching, typing animation, realistic response delay, and context from the user's profile, workouts, meals, and progress.
- **Progress tracking** for body weight, measurements, photos placeholder, workout volume, consistency, streaks, and charts.
- **History timeline** that groups saved daily workouts, meals, body check-ins, calories, protein, and training volume by date.
- **Local-first architecture** using AsyncStorage, with services and data models structured so a backend or real AI API can be added later.

## Tech Stack

- Expo
- React Native
- TypeScript
- React Navigation
- AsyncStorage
- React Native SVG
- Lucide icons
- Expo Linear Gradient

## Project Structure

```text
src/
  components/       Reusable UI, motion, cards, header, charts, inputs
  context/          Local app state and persistence orchestration
  data/             Demo data and local food catalog
  navigation/       Stack and tab navigation types/config
  screens/          Onboarding, dashboard, workouts, meals, coach, progress, history, profile
  services/         Nutrition math, coach logic, progressive overload, storage
  theme/            Colors, spacing, typography, radii
  types/            TypeScript data models
  utils/            Date helpers
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the Expo web app:

```bash
npm run web
```

Run on native targets:

```bash
npm run ios
npm run android
```

Type-check the project:

```bash
npm run typecheck
```

## Core Data Models

Volt includes typed models for:

- `UserProfile`
- `WorkoutPlan`
- `Exercise`
- `WorkoutSession`
- `SetEntry`
- `Meal`
- `FoodItem`
- `DailyNutrition`
- `BodyProgress`
- `CoachMessage`

## Notes

The coach response system is currently rule-based and local. The code is intentionally organized so the simulated coach can later be replaced by an API-backed AI coach without reshaping the UI or app state.

## License

MIT
