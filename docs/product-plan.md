# Ice Fit Product Plan

## 1. Mobile UI Direction

Ice Fit is a mobile-first adaptive workout coach. The first screen is the workout experience, not a landing page or dashboard. The product should feel calm, precise, premium and training-focused: a simple workout app on the surface with a structured coaching system underneath.

Design principles:

- Mobile app first, desktop second.
- One primary action per screen.
- Large tap targets, sticky bottom navigation, safe-area spacing.
- Cards for workouts and exercises, not tables.
- Quiet information hierarchy: clear headings, strong numbers, restrained labels.
- AI appears as coaching insight and explanation, not as a novelty chatbot.
- Safety notes are concise, visible and grounded.

## 2. Design System

Palette:

- Ink: near-black indigo for primary surfaces and type.
- Paper: cool off-white app background.
- Surface: warm white cards.
- Accent: confident green for progress and completion.
- Support colors: amber for readiness caution, red for pain or safety.
- Borders: subtle cool grey.

Typography:

- System font stack for iPhone-native rendering.
- Strong screen titles.
- Compact metadata labels.
- Large workout numbers for duration, sets, streaks and adherence.

Components:

- `AppShell`: safe-area shell, mobile frame constraints and bottom navigation.
- `BottomTabs`: Today, Plan, Progress, Coach, Profile.
- `MobileHeader`: contextual title, date and small actions.
- `PrimaryButton`: large thumb-friendly command button.
- `WorkoutCard`, `ExerciseCard`, `SetLogger`, `RestTimer`.
- `ReadinessSheet`, `ProgressCard`, `CoachMessage`, `PlanDayCard`, `MetricCard`.
- `EmptyState`, `LoadingState`, `SafetyNote`, `SwipeActionCard`.

## 3. Screen UX Plan

Today:

- Greeting, workout name, focus, duration and readiness status.
- Start or continue workout action.
- Progress ring/bar that reflects completed sets.
- Exercise cards with target reps, suggested weight, last performance and coaching cue.
- Fast set logging with weight, reps, effort, pain flag and one-tap completion.
- Automatic rest timer after completing a set.

Plan:

- Weekly split with day focus, muscles covered, duration and readiness notes.
- AI explanation of why the plan is balanced.
- Edit and regenerate actions, with regeneration treated as a meaningful change.
- Three-day plans use Full Body A/B/C for balanced coverage.

Progress:

- Adherence, completed workouts, streak, consistency score.
- Muscle group volume and strength trend cards.
- Personal records and AI progress insight.
- Visual cards instead of dense charts.

Coach:

- Trainer-style chat with suggested prompts.
- Uses profile, plan, logs, readiness and exercise library on the server.
- Refuses medical diagnosis and unsafe programming.

Profile:

- Goal, experience, training days, equipment, body weight, injuries and session length.
- Settings, export/delete placeholders and AI privacy note.

Onboarding:

- Step-by-step mobile flow.
- Optional natural-language profile box.
- GPT-4o mini parsing endpoint returns structured profile JSON for confirmation.
- Rules-based plan generation happens after confirmation.

## 4. Technical Architecture

Local iPhone testing flow:

```text
iPhone Safari or installed PWA
-> http://<laptop-local-ip>:3000
-> same-origin relative fetch("/api/...")
-> Express API running on the Windows laptop
-> local MSSQL via Windows Authentication
-> OpenAI API from the backend only
```

Important boundaries:

- The frontend uses only relative API paths such as `/api/workout/today`.
- The frontend never contains MSSQL host names, usernames, passwords, connection strings or Windows Authentication details.
- The frontend never contains `OPENAI_API_KEY`.
- `DB_SERVER=localhost` is valid because the backend runs on the laptop.
- On iPhone, use the laptop Wi-Fi IPv4 address, not `localhost`.
- Dev server listens on `0.0.0.0`.

Runtime shape:

- Express owns `/api/*`.
- Vite serves the React PWA through the same Express origin during development.
- Production build serves static files from `dist`.
- API routes can run with mock in-memory state if MSSQL is not available, while the MSSQL connector and schema are ready for local persistence.

## 5. Database Schema

Core tables:

- `Users`
- `UserProfiles`
- `Exercises`
- `WorkoutPlans`
- `WorkoutDays`
- `WorkoutLogs`
- `SetLogs`
- `ReadinessLogs`
- `WeeklyReviews`
- `AiEvents`
- `ExerciseSubstitutions`
- `ProgressMetrics`

The MVP is single-user local testing, but every table includes `UserId` so multi-user auth can be added later.

## 6. API Structure

Routes:

- `POST /api/onboarding/parse`
- `POST /api/workout/generate`
- `GET /api/workout/today`
- `POST /api/workout/log`
- `POST /api/workout/complete`
- `POST /api/workout/substitute`
- `POST /api/progression/next-target`
- `POST /api/readiness`
- `GET /api/progress/summary`
- `POST /api/ai/plan-explanation`
- `POST /api/ai/weekly-review`
- `POST /api/ai/chat`
- `POST /api/ai/replan-missed-session`

AI is constrained to explanation, adaptation and coaching. The workout plan itself is generated by deterministic rules first.

## 7. Build And Local Test Steps

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` only in `.env` if AI features should call OpenAI.
3. Keep MSSQL local settings server-side:
   - `DB_SERVER=localhost`
   - `DB_NAME=ice_training_dev`
   - `DB_TRUSTED_CONNECTION=true`
4. Install dependencies with `npm.cmd install`.
5. Start the app with `npm.cmd run dev -- --hostname 0.0.0.0`.
6. Find the laptop IPv4 address with `ipconfig`.
7. Open `http://<laptop-ip>:3000` on iPhone Safari.
8. Add to Home Screen.
9. If blocked, allow Node.js or port 3000 through Windows Firewall.

