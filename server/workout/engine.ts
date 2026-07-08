import { alternativesFor, exerciseLibrary, findExercise } from "./exercises.js";
import type {
  Effort,
  Exercise,
  ExercisePrescription,
  FitnessProfile,
  ProgressSummary,
  ReadinessLog,
  SetLog,
  TodayWorkout,
  WorkoutDay,
  WorkoutPlan
} from "./types.js";

export const LOCAL_USER_ID = "local-user";

export const safetyNote =
  "General fitness guidance only. Stop if pain increases and consult a qualified professional for injury, medical conditions or persistent pain.";

export const defaultProfile: FitnessProfile = {
  userId: LOCAL_USER_ID,
  goal: "general_fitness",
  experience: "beginner",
  trainingDays: 3,
  equipment: ["bodyweight", "dumbbells", "bench"],
  injuryFlags: [],
  preferredSessionLength: 45,
  notes: "Build consistency with balanced full-body training."
};

const movementPlan = {
  full_body_a: ["squat", "horizontal_push", "horizontal_pull", "hinge", "core"],
  full_body_b: ["hinge", "vertical_push", "vertical_pull", "squat", "core"],
  full_body_c: ["squat", "horizontal_push", "vertical_pull", "hinge", "arms"],
  upper: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "arms"],
  lower: ["squat", "hinge", "squat", "core", "conditioning"],
  conditioning: ["conditioning", "core", "horizontal_pull", "squat"]
} as const;

const splitNames = {
  full_body_a: "Full Body A",
  full_body_b: "Full Body B",
  full_body_c: "Full Body C",
  upper: "Upper Strength",
  lower: "Lower Strength",
  conditioning: "Capacity"
} as const;

type TemplateKey = keyof typeof movementPlan;

export function generateWorkoutPlan(profile: FitnessProfile): WorkoutPlan {
  const days = Math.max(2, Math.min(6, profile.trainingDays || 3));
  const threeDayTemplates: TemplateKey[] = ["full_body_a", "full_body_b", "full_body_c"];
  const multiDayTemplates: TemplateKey[] = ["upper", "lower", "full_body_a", "conditioning", "upper", "lower"];
  const templates: TemplateKey[] =
    days <= 3
      ? threeDayTemplates.slice(0, days)
      : multiDayTemplates.slice(0, days);

  const workoutDays = templates.map((template, index) => buildWorkoutDay(profile, template, index));
  const split = days <= 3 ? "Balanced Full Body" : "Upper / Lower / Full Body";

  return {
    id: `plan-${Date.now()}`,
    userId: profile.userId,
    createdAt: new Date().toISOString(),
    split,
    summary: planSummary(profile, split),
    days: workoutDays
  };
}

export function getTodayWorkout(plan: WorkoutPlan, readiness: ReadinessLog | undefined, setLogs: SetLog[]): TodayWorkout {
  const dayNumber = Math.floor(Date.now() / 86_400_000) % plan.days.length;
  const baseDay = plan.days[dayNumber] ?? plan.days[0];
  const workoutDay = readiness ? adjustForReadiness(baseDay, readiness) : baseDay;
  const completedSetIds = setLogs
    .filter((set) => set.workoutDayId === workoutDay.id)
    .map((set) => `${set.exerciseId}-${set.setNumber}`);
  const totalSets = workoutDay.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);

  return {
    planId: plan.id,
    workoutDay,
    readiness,
    completedSetIds,
    progressPercent: totalSets === 0 ? 0 : Math.round((completedSetIds.length / totalSets) * 100),
    safetyNote
  };
}

export function nextTarget(
  exercise: ExercisePrescription,
  previousSets: SetLog[]
): { suggestedWeightKg: number; note: string; effort: Effort } {
  const current = exercise.suggestedWeightKg ?? 0;
  const relevant = previousSets.filter((set) => set.exerciseId === exercise.exerciseId).slice(-exercise.targetSets);
  const topRep = Number(exercise.repRange.split("-")[1] ?? 12);
  const allTop = relevant.length >= exercise.targetSets && relevant.every((set) => set.reps >= topRep && !set.pain);
  const anyPain = relevant.some((set) => set.pain);
  const maxed = relevant.some((set) => set.effort === "max");
  const hard = relevant.some((set) => set.effort === "hard");

  if (anyPain) {
    return {
      suggestedWeightKg: Math.max(0, roundHalf(current * 0.9)),
      effort: "good",
      note: "Pain was flagged, so reduce load and choose a safer range today."
    };
  }

  if (allTop && !hard && !maxed) {
    return {
      suggestedWeightKg: roundHalf(current + loadJump(current)),
      effort: "good",
      note: "You cleared the top of the range. Add a small load jump next time."
    };
  }

  if (maxed) {
    return {
      suggestedWeightKg: current,
      effort: "hard",
      note: "Keep the load steady until it feels controlled again."
    };
  }

  return {
    suggestedWeightKg: current,
    effort: "good",
    note: "Stay here and try to add one rep before increasing load."
  };
}

export function buildProgressSummary(plan: WorkoutPlan, setLogs: SetLog[]): ProgressSummary {
  const completedWorkoutDays = new Set(setLogs.map((set) => set.workoutDayId));
  const muscleSets = new Map<string, number>();

  for (const set of setLogs) {
    const prescription = plan.days
      .flatMap((day) => day.exercises)
      .find((exercise) => exercise.exerciseId === set.exerciseId);
    prescription?.muscles.forEach((muscle) => muscleSets.set(muscle, (muscleSets.get(muscle) ?? 0) + 1));
  }

  const muscleVolume = Array.from(new Set(plan.days.flatMap((day) => day.musclesCovered)))
    .slice(0, 7)
    .map((muscle) => {
      const sets = muscleSets.get(muscle) ?? 0;
      return {
        muscle,
        sets,
        status: sets < 4 ? "low" : sets > 14 ? "high" : "on_track"
      } as const;
    });

  const completedWorkouts = completedWorkoutDays.size;
  const adherence = Math.min(100, Math.round((completedWorkouts / Math.max(1, plan.days.length)) * 100));

  return {
    adherenceText: `You trained ${completedWorkouts} of ${plan.days.length} planned days this cycle`,
    completedWorkouts,
    streak: completedWorkouts,
    consistencyScore: adherence,
    strengthTrend: setLogs.length > 5 ? "Loads are trending up on your main lifts." : "Log a few more sessions to show a trend.",
    personalRecords: buildPersonalRecords(setLogs),
    muscleVolume,
    aiInsight:
      adherence >= 75
        ? "Your consistency is strong. Keep progression conservative and protect recovery."
        : "A shorter session is better than skipping. Use express workouts when time is tight."
  };
}

export function substituteExercise(
  exerciseId: string,
  profile: FitnessProfile
): { replacement?: Exercise; reason: string; alternatives: Exercise[] } {
  const current = findExercise(exerciseId);

  if (!current) {
    return { reason: "Exercise was not found in the approved library.", alternatives: [] };
  }

  const alternatives = alternativesFor(current, profile.equipment, profile.injuryFlags);
  const replacement = alternatives[0];

  return {
    replacement,
    alternatives,
    reason: replacement
      ? `${replacement.name} keeps the same movement pattern while matching your equipment and current limitations.`
      : "No approved substitute matched your equipment and limitations."
  };
}

function buildWorkoutDay(profile: FitnessProfile, template: TemplateKey, dayIndex: number): WorkoutDay {
  const patterns = movementPlan[template];
  const exercises = patterns.map((pattern, index) => prescribeExercise(profile, pattern, dayIndex, index));
  const musclesCovered = Array.from(new Set(exercises.flatMap((exercise) => exercise.muscles)));
  const baseDuration = Math.min(profile.preferredSessionLength, 35 + exercises.length * 4);

  return {
    id: `${template}-${dayIndex + 1}`,
    name: splitNames[template],
    focus: focusFor(template, profile.goal),
    dayIndex,
    estimatedDuration: Math.max(25, baseDuration),
    musclesCovered,
    exercises
  };
}

function prescribeExercise(
  profile: FitnessProfile,
  pattern: (typeof movementPlan)[TemplateKey][number],
  dayIndex: number,
  exerciseIndex: number
): ExercisePrescription {
  const exercise = chooseExercise(profile, pattern, dayIndex + exerciseIndex);
  const targetSets = setsFor(profile.experience, pattern);
  const repRange = repsFor(profile.goal, pattern);
  const alternatives = alternativesFor(exercise, profile.equipment, profile.injuryFlags).map((item) => item.name);
  const suggestedWeightKg = suggestedWeight(profile, exercise, exerciseIndex);

  return {
    prescriptionId: `${exercise.id}-${dayIndex}-${exerciseIndex}`,
    exerciseId: exercise.id,
    name: exercise.name,
    movementCategory: exercise.category,
    muscles: exercise.muscles,
    targetSets,
    repRange,
    suggestedWeightKg,
    lastPerformance: "No recent log",
    note: exercise.cue,
    equipment: exercise.equipment,
    alternatives
  };
}

function chooseExercise(
  profile: FitnessProfile,
  pattern: (typeof movementPlan)[TemplateKey][number],
  seed: number
): Exercise {
  const equipment = profile.equipment.length > 0 ? profile.equipment : ["bodyweight"];
  const candidates = exerciseLibrary.filter((exercise) => {
    const matchesPattern = exercise.movementPattern === pattern;
    const matchesEquipment = exercise.equipment.some((item) => equipment.includes(item) || item === "bodyweight");
    const safeEnough = !exercise.avoidWhen.some((flag) => profile.injuryFlags.includes(flag));
    return matchesPattern && matchesEquipment && safeEnough;
  });

  const fallback = exerciseLibrary.find((exercise) => exercise.movementPattern === pattern) ?? exerciseLibrary[0];
  return candidates[seed % Math.max(1, candidates.length)] ?? fallback;
}

function setsFor(experience: FitnessProfile["experience"], pattern: string): number {
  if (pattern === "conditioning") return 1;
  if (pattern === "core" || pattern === "arms") return experience === "advanced" ? 3 : 2;
  if (experience === "beginner") return 2;
  if (experience === "novice") return 3;
  return 4;
}

function repsFor(goal: FitnessProfile["goal"], pattern: string): string {
  if (pattern === "conditioning") return "8-12 min";
  if (pattern === "core") return "8-12";
  if (goal === "strength") return "4-6";
  if (goal === "fat_loss") return "10-15";
  return "8-12";
}

function suggestedWeight(profile: FitnessProfile, exercise: Exercise, index: number): number | undefined {
  if (exercise.equipment.includes("bodyweight") && exercise.equipment.length === 1) return undefined;
  const base = profile.experience === "beginner" ? 8 : profile.experience === "novice" ? 14 : 22;
  return roundHalf(base + index * 2);
}

function focusFor(template: TemplateKey, goal: FitnessProfile["goal"]): string {
  if (goal === "fat_loss") return "Full-body strength with steady energy cost";
  if (goal === "strength") return "Controlled heavy practice and quality reps";
  if (goal === "return_to_training") return "Low-friction rebuild with joint-friendly volume";
  if (template === "conditioning") return "Capacity and recovery";
  return "Balanced muscle and strength progression";
}

function planSummary(profile: FitnessProfile, split: string): string {
  const days = `${profile.trainingDays} days per week`;
  const equipment = profile.equipment.length ? profile.equipment.join(", ") : "bodyweight";
  const bodyContext =
    profile.goal === "fat_loss" && profile.bodyWeightKg && profile.heightCm
      ? ` Current BMI is ${calculateBmi(profile.bodyWeightKg, profile.heightCm).toFixed(1)}; use this as a tracking context, not a diagnosis.`
      : "";
  const targetContext =
    profile.goal === "fat_loss" && profile.targetWeightKg
      ? ` Target weight noted: ${profile.targetWeightKg} kg.`
      : "";
  return `${split} built for ${days}, ${profile.experience} experience and available equipment: ${equipment}.${bodyContext}${targetContext}`;
}

function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function adjustForReadiness(day: WorkoutDay, readiness: ReadinessLog): WorkoutDay {
  const reduceVolume = readiness.energy <= 2 || readiness.soreness >= 4 || readiness.pain;
  const shortSession = readiness.timeAvailable < day.estimatedDuration;

  if (!reduceVolume && !shortSession) return day;

  const reduction = readiness.pain ? 0.7 : 0.85;
  const exercises = day.exercises.map((exercise) => ({
    ...exercise,
    targetSets: Math.max(1, Math.round(exercise.targetSets * reduction)),
    note: readiness.pain
      ? `${exercise.note} Avoid painful range today and stop if symptoms increase.`
      : `${exercise.note} Keep two reps in reserve today.`
  }));

  return {
    ...day,
    name: shortSession ? `${day.name} Express` : `${day.name} Adjusted`,
    estimatedDuration: Math.min(day.estimatedDuration, readiness.timeAvailable || day.estimatedDuration),
    exercises: shortSession ? exercises.slice(0, Math.max(3, exercises.length - 1)) : exercises
  };
}

function buildPersonalRecords(setLogs: SetLog[]): string[] {
  if (setLogs.length === 0) return ["First session waiting"];

  const bestByExercise = new Map<string, SetLog>();
  for (const set of setLogs) {
    const score = set.weightKg * set.reps;
    const previous = bestByExercise.get(set.exerciseId);
    if (!previous || score > previous.weightKg * previous.reps) {
      bestByExercise.set(set.exerciseId, set);
    }
  }

  return Array.from(bestByExercise.entries())
    .slice(0, 3)
    .map(([exerciseId, set]) => `${titleCase(exerciseId)}: ${set.weightKg} kg x ${set.reps}`);
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function loadJump(current: number): number {
  if (current < 10) return 1;
  if (current < 30) return 2;
  return 2.5;
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
