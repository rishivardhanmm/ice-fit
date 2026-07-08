export type Goal = "fat_loss" | "muscle_gain" | "strength" | "general_fitness" | "return_to_training";
export type Experience = "beginner" | "novice" | "intermediate" | "advanced";
export type Effort = "easy" | "good" | "hard" | "max";

export interface FitnessProfile {
  userId: string;
  goal: Goal;
  experience: Experience;
  trainingDays: number;
  equipment: string[];
  bodyWeightKg?: number;
  heightCm?: number;
  targetWeightKg?: number;
  injuryFlags: string[];
  preferredSessionLength: number;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  movementPattern:
    | "squat"
    | "hinge"
    | "horizontal_push"
    | "vertical_push"
    | "horizontal_pull"
    | "vertical_pull"
    | "core"
    | "arms"
    | "conditioning";
  category: string;
  muscles: string[];
  equipment: string[];
  avoidWhen: string[];
  cue: string;
}

export interface ExercisePrescription {
  prescriptionId: string;
  exerciseId: string;
  name: string;
  movementCategory: string;
  muscles: string[];
  targetSets: number;
  repRange: string;
  suggestedWeightKg?: number;
  lastPerformance: string;
  note: string;
  equipment: string[];
  alternatives: string[];
}

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  dayIndex: number;
  estimatedDuration: number;
  musclesCovered: string[];
  exercises: ExercisePrescription[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  createdAt: string;
  split: string;
  summary: string;
  days: WorkoutDay[];
}

export interface ReadinessLog {
  id: string;
  userId: string;
  date: string;
  energy: number;
  soreness: number;
  pain: boolean;
  timeAvailable: number;
  note?: string;
}

export interface SetLog {
  id: string;
  userId: string;
  workoutDayId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  effort: Effort;
  pain: boolean;
  completedAt: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutDayId: string;
  date: string;
  completed: boolean;
  setLogs: SetLog[];
}

export interface TodayWorkout {
  planId: string;
  workoutDay: WorkoutDay;
  readiness?: ReadinessLog;
  completedSetIds: string[];
  progressPercent: number;
  safetyNote: string;
}

export interface ProgressSummary {
  adherenceText: string;
  completedWorkouts: number;
  streak: number;
  consistencyScore: number;
  strengthTrend: string;
  personalRecords: string[];
  muscleVolume: Array<{ muscle: string; sets: number; status: "low" | "on_track" | "high" }>;
  aiInsight: string;
}
