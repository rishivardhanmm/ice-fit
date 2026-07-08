import { Router } from "express";
import { databaseStatus } from "../db/repository.js";
import { coachReply, explainPlan, parseProfileText, replanMissedSession, weeklyReview } from "../ai/openaiClient.js";
import {
  completeWorkout,
  getState,
  logReadiness,
  logSet,
  nextTargetFor,
  progressSummary,
  regeneratePlan,
  substitute,
  today,
  updateProfile
} from "../services/appState.js";
import { LOCAL_USER_ID } from "../workout/engine.js";
import type { FitnessProfile } from "../workout/types.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ice-fit",
    database: databaseStatus()
  });
});

apiRouter.post("/onboarding/parse", async (req, res, next) => {
  try {
    const parsed = await parseProfileText(String(req.body?.text ?? ""));
    res.json({ profile: parsed });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/workout/generate", async (req, res, next) => {
  try {
    const profile = normalizeProfile(req.body?.profile);
    const plan = await updateProfile(profile);
    res.json({ profile, plan, today: today() });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/workout/today", (_req, res) => {
  const state = getState();
  res.json({ profile: state.profile, plan: state.plan, today: today() });
});

apiRouter.post("/workout/log", async (req, res, next) => {
  try {
    const set = await logSet({
      workoutDayId: String(req.body?.workoutDayId),
      exerciseId: String(req.body?.exerciseId),
      setNumber: Number(req.body?.setNumber ?? 1),
      weightKg: Number(req.body?.weightKg ?? 0),
      reps: Number(req.body?.reps ?? 0),
      effort: req.body?.effort ?? "good",
      pain: Boolean(req.body?.pain)
    });
    res.json({ set, nextTarget: nextTargetFor(set.exerciseId), today: today() });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/workout/complete", async (req, res, next) => {
  try {
    const result = await completeWorkout(String(req.body?.workoutDayId));
    res.json({ ...result, progress: progressSummary() });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/workout/substitute", (req, res) => {
  res.json(substitute(String(req.body?.exerciseId)));
});

apiRouter.post("/progression/next-target", (req, res) => {
  res.json(nextTargetFor(String(req.body?.exerciseId)));
});

apiRouter.post("/readiness", async (req, res, next) => {
  try {
    const readiness = await logReadiness({
      energy: clamp(Number(req.body?.energy ?? 3), 1, 5),
      soreness: clamp(Number(req.body?.soreness ?? 2), 1, 5),
      pain: Boolean(req.body?.pain),
      timeAvailable: clamp(Number(req.body?.timeAvailable ?? 45), 15, 120),
      note: req.body?.note ? String(req.body.note) : undefined
    });
    res.json({ readiness, today: today() });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/progress/summary", (_req, res) => {
  res.json(progressSummary());
});

apiRouter.post("/ai/plan-explanation", async (_req, res, next) => {
  try {
    const state = getState();
    res.json({ text: await explainPlan(state.profile, state.plan) });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/ai/weekly-review", async (_req, res, next) => {
  try {
    res.json({ text: await weeklyReview(progressSummary()) });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/ai/chat", async (req, res, next) => {
  try {
    const state = getState();
    const message = String(req.body?.message ?? "");
    const text = await coachReply({
      message,
      profile: state.profile,
      plan: state.plan,
      today: today(),
      progress: progressSummary()
    });
    res.json({ text });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/ai/replan-missed-session", async (_req, res, next) => {
  try {
    res.json({ text: await replanMissedSession(today()) });
  } catch (error) {
    next(error);
  }
});

function normalizeProfile(input: Partial<FitnessProfile> | undefined): FitnessProfile {
  return {
    userId: LOCAL_USER_ID,
    goal: input?.goal ?? "general_fitness",
    experience: input?.experience ?? "beginner",
    trainingDays: clamp(Number(input?.trainingDays ?? 3), 2, 6),
    equipment: Array.isArray(input?.equipment) && input.equipment.length ? input.equipment : ["bodyweight", "dumbbells"],
    bodyWeightKg: positiveNumber(input?.bodyWeightKg),
    heightCm: positiveNumber(input?.heightCm),
    targetWeightKg: positiveNumber(input?.targetWeightKg),
    injuryFlags: Array.isArray(input?.injuryFlags) ? input.injuryFlags : [],
    preferredSessionLength: clamp(Number(input?.preferredSessionLength ?? 45), 20, 90),
    notes: input?.notes
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function positiveNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}
