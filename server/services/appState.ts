import {
  buildProgressSummary,
  defaultProfile,
  generateWorkoutPlan,
  getTodayWorkout,
  LOCAL_USER_ID,
  nextTarget,
  substituteExercise
} from "../workout/engine.js";
import type { FitnessProfile, ReadinessLog, SetLog, WorkoutPlan } from "../workout/types.js";
import { persistEvent } from "../db/repository.js";

interface AppState {
  profile: FitnessProfile;
  plan: WorkoutPlan;
  readiness?: ReadinessLog;
  setLogs: SetLog[];
  completedWorkoutDayIds: Set<string>;
}

const state: AppState = {
  profile: defaultProfile,
  plan: generateWorkoutPlan(defaultProfile),
  setLogs: [],
  completedWorkoutDayIds: new Set()
};

export function getState(): AppState {
  return state;
}

export async function updateProfile(profile: FitnessProfile): Promise<WorkoutPlan> {
  state.profile = { ...profile, userId: profile.userId || LOCAL_USER_ID };
  state.plan = generateWorkoutPlan(state.profile);
  state.setLogs = [];
  state.completedWorkoutDayIds = new Set();
  await persistEvent("profile_saved", { profile: state.profile, plan: state.plan });
  return state.plan;
}

export async function regeneratePlan(profile?: FitnessProfile): Promise<WorkoutPlan> {
  if (profile) {
    state.profile = { ...profile, userId: profile.userId || LOCAL_USER_ID };
  }
  state.plan = generateWorkoutPlan(state.profile);
  await persistEvent("plan_generated", { profile: state.profile, plan: state.plan });
  return state.plan;
}

export function today() {
  return getTodayWorkout(state.plan, state.readiness, state.setLogs);
}

export async function logReadiness(input: Omit<ReadinessLog, "id" | "userId" | "date">): Promise<ReadinessLog> {
  state.readiness = {
    ...input,
    id: `ready-${Date.now()}`,
    userId: LOCAL_USER_ID,
    date: new Date().toISOString()
  };
  await persistEvent("readiness_logged", { readiness: state.readiness });
  return state.readiness;
}

export async function logSet(input: Omit<SetLog, "id" | "userId" | "completedAt">): Promise<SetLog> {
  const set: SetLog = {
    ...input,
    id: `set-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId: LOCAL_USER_ID,
    completedAt: new Date().toISOString()
  };
  state.setLogs.push(set);
  await persistEvent("set_logged", { set });
  return set;
}

export async function completeWorkout(workoutDayId: string): Promise<{ workoutDayId: string; completed: boolean }> {
  state.completedWorkoutDayIds.add(workoutDayId);
  await persistEvent("workout_completed", { workoutDayId, userId: LOCAL_USER_ID, completedAt: new Date().toISOString() });
  return { workoutDayId, completed: true };
}

export function progressSummary() {
  return buildProgressSummary(state.plan, state.setLogs);
}

export function nextTargetFor(exerciseId: string) {
  const exercise = state.plan.days.flatMap((day) => day.exercises).find((item) => item.exerciseId === exerciseId);
  if (!exercise) {
    return { suggestedWeightKg: 0, effort: "good", note: "Exercise was not found in the active plan." };
  }
  return nextTarget(exercise, state.setLogs);
}

export function substitute(exerciseId: string) {
  return substituteExercise(exerciseId, state.profile);
}

