import "dotenv/config";
import OpenAI from "openai";
import { persistEvent } from "../db/repository.js";
import type { FitnessProfile, ProgressSummary, TodayWorkout, WorkoutPlan } from "../workout/types.js";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const baseURL = process.env.OPENAI_BASE_URL;
let client: OpenAI | undefined;

function getClient(): OpenAI | undefined {
  if (!process.env.OPENAI_API_KEY) return undefined;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL });
  return client;
}

export interface ProfileParseResult extends Partial<FitnessProfile> {
  confidence: number;
  rationale: {
    goal: string;
    experience: string;
    trainingDays: string;
    equipment: string;
    injuryFlags: string;
    preferredSessionLength: string;
    bodyWeightKg: string;
    heightCm: string;
    targetWeightKg: string;
  };
}

export async function parseProfileText(text: string): Promise<ProfileParseResult> {
  const fallback = fallbackProfileParse(text);
  const openai = getClient();
  if (!openai || !text.trim()) return fallback;

  try {
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Extract a fitness onboarding profile. Return only safe, conservative training preferences. Do not diagnose injury. Do not invent body weight, height, or target weight; use 0 for unknown numeric body fields."
        },
        { role: "user", content: text }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "fitness_profile_parse",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              goal: {
                type: "string",
                enum: ["fat_loss", "muscle_gain", "strength", "general_fitness", "return_to_training"]
              },
              experience: { type: "string", enum: ["beginner", "novice", "intermediate", "advanced"] },
              trainingDays: { type: "number" },
              equipment: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["bodyweight", "dumbbells", "bench", "barbell", "cable", "bands", "machine", "bike", "treadmill"]
                }
              },
              injuryFlags: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["knee_pain", "shoulder_pain", "back_pain", "wrist_pain", "elbow_pain"]
                }
              },
              bodyWeightKg: { type: "number" },
              heightCm: { type: "number" },
              targetWeightKg: { type: "number" },
              preferredSessionLength: { type: "number" },
              notes: { type: "string" },
              confidence: { type: "number" },
              rationale: {
                type: "object",
                additionalProperties: false,
                properties: {
                  goal: { type: "string" },
                  experience: { type: "string" },
                  trainingDays: { type: "string" },
                  equipment: { type: "string" },
                  injuryFlags: { type: "string" },
                  preferredSessionLength: { type: "string" },
                  bodyWeightKg: { type: "string" },
                  heightCm: { type: "string" },
                  targetWeightKg: { type: "string" }
                },
                required: [
                  "goal",
                  "experience",
                  "trainingDays",
                  "equipment",
                  "injuryFlags",
                  "preferredSessionLength",
                  "bodyWeightKg",
                  "heightCm",
                  "targetWeightKg"
                ]
              }
            },
            required: [
              "goal",
              "experience",
              "trainingDays",
              "equipment",
              "injuryFlags",
              "bodyWeightKg",
              "heightCm",
              "targetWeightKg",
              "preferredSessionLength",
              "notes",
              "confidence",
              "rationale"
            ]
          }
        }
      }
    });

    const parsed = normalizeParseResult(JSON.parse(response.output_text), text, fallback);
    await persistEvent("ai_event", { eventType: "onboarding_parse", model, prompt: text, response: parsed });
    return parsed;
  } catch (error) {
    console.warn(`[ai] Falling back from OpenAI profile parse: ${(error as Error).message}`);
    return fallback;
  }
}

function normalizeParseResult(parsed: ProfileParseResult, text: string, fallback: ProfileParseResult): ProfileParseResult {
  const equipment = normalizeEquipment(parsed.equipment);
  const injuryFlags = normalizeInjuryFlags(parsed.injuryFlags);
  const confidence = parsed.confidence > 0 ? Math.min(1, parsed.confidence) : fallback.confidence;
  const bodyWeightKg = parsed.bodyWeightKg && parsed.bodyWeightKg > 0 ? parsed.bodyWeightKg : undefined;
  const heightCm = parsed.heightCm && parsed.heightCm > 0 ? parsed.heightCm : undefined;
  const targetWeightKg = parsed.targetWeightKg && parsed.targetWeightKg > 0 ? parsed.targetWeightKg : undefined;
  const rationale = {
    ...fallback.rationale,
    ...(parsed.rationale ?? {})
  };

  if (!bodyWeightKg) {
    rationale.bodyWeightKg = "No body weight was provided, so the app will ask instead of assuming.";
  }
  if (!heightCm) {
    rationale.heightCm = "No height was provided, so BMI cannot be calculated yet.";
  }
  if (!targetWeightKg) {
    rationale.targetWeightKg =
      parsed.goal === "fat_loss"
        ? "No fat-loss target weight was provided, so the app will ask you to choose one."
        : "No target weight is needed unless you choose to track one.";
  }

  return {
    ...parsed,
    equipment: equipment.length ? equipment : fallback.equipment,
    injuryFlags,
    bodyWeightKg,
    heightCm,
    targetWeightKg,
    notes: parsed.notes?.trim() ? parsed.notes : text,
    confidence,
    rationale
  };
}

function normalizeEquipment(equipment: string[] | undefined): string[] {
  const values = new Set<string>();
  for (const item of equipment ?? []) {
    const normalized = item.toLowerCase().replace(/\s+/g, "_");
    if (normalized.includes("dumbbell")) values.add("dumbbells");
    if (normalized.includes("bench")) values.add("bench");
    if (normalized.includes("barbell")) values.add("barbell");
    if (normalized.includes("cable")) values.add("cable");
    if (normalized.includes("band")) values.add("bands");
    if (normalized.includes("machine")) values.add("machine");
    if (normalized.includes("bike")) values.add("bike");
    if (normalized.includes("treadmill")) values.add("treadmill");
    if (normalized.includes("body")) values.add("bodyweight");
  }
  values.add("bodyweight");
  return Array.from(values);
}

function normalizeInjuryFlags(injuryFlags: string[] | undefined): string[] {
  const values = new Set<string>();
  for (const flag of injuryFlags ?? []) {
    const normalized = flag.toLowerCase().replace(/\s+/g, "_");
    if (normalized.includes("knee")) values.add("knee_pain");
    if (normalized.includes("shoulder")) values.add("shoulder_pain");
    if (normalized.includes("back")) values.add("back_pain");
    if (normalized.includes("wrist")) values.add("wrist_pain");
    if (normalized.includes("elbow")) values.add("elbow_pain");
  }
  return Array.from(values);
}

export async function coachReply(input: {
  message: string;
  profile: FitnessProfile;
  plan: WorkoutPlan;
  today: TodayWorkout;
  progress: ProgressSummary;
}): Promise<string> {
  const openai = getClient();
  const fallback =
    "I would keep today's session simple: complete the main movements, leave one or two reps in reserve, and stop if pain increases.";

  if (!openai) return fallback;

  try {
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a careful fitness coach. Use only the provided plan and approved exercise context. Do not diagnose, treat injury, give medical advice, encourage extreme dieting or invent unsafe exercises. Include a brief safety reminder when pain or injury is mentioned."
        },
        { role: "user", content: JSON.stringify(input) }
      ]
    });
    await persistEvent("ai_event", { eventType: "coach_chat", model, prompt: input.message, response: response.output_text });
    return response.output_text;
  } catch (error) {
    console.warn(`[ai] Falling back from OpenAI coach reply: ${(error as Error).message}`);
    return fallback;
  }
}

export async function explainPlan(profile: FitnessProfile, plan: WorkoutPlan): Promise<string> {
  return aiText(
    "Explain why this training plan is balanced. Be concise, practical and non-medical.",
    { profile, plan },
    "This plan balances squat, hinge, push, pull and core work across the week so progress is steady without overloading one area."
  );
}

export async function weeklyReview(progress: ProgressSummary): Promise<string> {
  return aiText(
    "Write a short weekly training review. Be encouraging, specific and conservative.",
    progress,
    progress.aiInsight
  );
}

export async function replanMissedSession(today: TodayWorkout): Promise<string> {
  return aiText(
    "A user missed a workout. Suggest a safe adjustment without increasing weekly stress sharply.",
    today,
    "Move the missed session to the next available day and keep the following workout slightly lighter if recovery feels limited."
  );
}

async function aiText(system: string, payload: unknown, fallback: string): Promise<string> {
  const openai = getClient();
  if (!openai) return fallback;

  try {
    const response = await openai.responses.create({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(payload) }
      ]
    });
    await persistEvent("ai_event", { eventType: "text_generation", model, prompt: system, response: response.output_text });
    return response.output_text;
  } catch (error) {
    console.warn(`[ai] Falling back from OpenAI text generation: ${(error as Error).message}`);
    return fallback;
  }
}

function fallbackProfileParse(text: string): ProfileParseResult {
  const lower = text.toLowerCase();
  const equipment = ["bodyweight"];
  if (lower.includes("dumbbell")) equipment.push("dumbbells");
  if (lower.includes("barbell")) equipment.push("barbell");
  if (lower.includes("bench")) equipment.push("bench");
  if (lower.includes("cable")) equipment.push("cable");

  const injuryFlags: string[] = [];
  if (lower.includes("knee")) injuryFlags.push("knee_pain");
  if (lower.includes("shoulder")) injuryFlags.push("shoulder_pain");
  if (lower.includes("back")) injuryFlags.push("back_pain");

  const dayMatch = lower.match(/(\d)\s*(day|days)/);
  const minuteMatch = lower.match(/(\d{2,3})\s*(min|minute)/);
  const weightMatch = lower.match(/(\d{2,3})\s*(kg|kilos|kilograms)/);
  const heightCmMatch = lower.match(/(\d{3})\s*(cm|centimetres|centimeters)/);
  const targetWeightMatch = lower.match(/(?:target|goal|aim|reach|get to)\D{0,16}(\d{2,3})\s*(kg|kilos|kilograms)/);
  const goal = lower.includes("fat")
    ? "fat_loss"
    : lower.includes("strength")
      ? "strength"
      : lower.includes("muscle")
        ? "muscle_gain"
        : "general_fitness";
  const experience = lower.includes("beginner") ? "beginner" : lower.includes("advanced") ? "advanced" : "novice";
  const trainingDays = dayMatch ? Number(dayMatch[1]) : 3;
  const preferredSessionLength = minuteMatch ? Number(minuteMatch[1]) : 45;
  const bodyWeightKg = weightMatch ? Number(weightMatch[1]) : undefined;
  const heightCm = heightCmMatch ? Number(heightCmMatch[1]) : undefined;
  const targetWeightKg = targetWeightMatch ? Number(targetWeightMatch[1]) : undefined;

  return {
    goal,
    experience,
    trainingDays,
    equipment: Array.from(new Set(equipment)),
    injuryFlags,
    bodyWeightKg,
    heightCm,
    targetWeightKg,
    preferredSessionLength,
    notes: text,
    confidence: text.trim() ? 0.62 : 0.3,
    rationale: {
      goal: lower.includes("fat") || lower.includes("strength") || lower.includes("muscle")
        ? "Chosen from the goal language in your note."
        : "No specific goal was clear, so general fitness is safest.",
      experience: lower.includes("beginner") || lower.includes("advanced")
        ? "Matched from the experience wording you used."
        : "Defaulted to novice until you confirm your training history.",
      trainingDays: dayMatch ? `Found ${trainingDays} training days in your note.` : "No schedule was clear, so 3 days is a balanced default.",
      equipment: equipment.length > 1 ? "Matched the equipment you mentioned." : "Bodyweight is included as the safe baseline.",
      injuryFlags: injuryFlags.length ? "Flagged the body areas you mentioned so planning can avoid painful movements." : "No limitations were detected.",
      preferredSessionLength: minuteMatch ? `Found a ${preferredSessionLength} minute preference.` : "No duration was clear, so 45 minutes is a practical default.",
      bodyWeightKg: weightMatch ? `Found ${bodyWeightKg} kg in your note.` : "No body weight was detected, so this stays blank until you enter it.",
      heightCm: heightCmMatch ? `Found ${heightCm} cm in your note.` : "No height was detected, so BMI cannot be calculated yet.",
      targetWeightKg:
        targetWeightMatch && targetWeightKg
          ? `Found a target of ${targetWeightKg} kg in your note.`
          : goal === "fat_loss"
            ? "No fat-loss target weight was detected, so the app should ask you."
            : "No target weight is needed unless you want one."
    }
  };
}
