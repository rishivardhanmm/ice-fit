import { getPool, shouldUseMssql } from "./mssql.js";
import { exerciseLibrary } from "../workout/exercises.js";

type PersistableEvent =
  | "profile_saved"
  | "plan_generated"
  | "readiness_logged"
  | "set_logged"
  | "workout_completed"
  | "ai_event";

let dbAvailable: boolean | undefined;
let localUserId: string | undefined;
let seededExercises = false;

export async function persistEvent(eventType: PersistableEvent, payload: unknown): Promise<void> {
  if (!shouldUseMssql()) return;

  try {
    const pool = await getPool();
    const userId = await ensureLocalUser(pool);
    await seedExercises(pool);
    await persistDomainEvent(pool, userId, eventType, payload);
    dbAvailable = true;
    await pool
      .request()
      .input("UserId", userId)
      .input("EventType", eventType)
      .input("PayloadJson", JSON.stringify(payload))
      .query(
        "INSERT INTO dbo.AiEvents (UserId, EventType, PayloadJson, CreatedAt) VALUES (@UserId, @EventType, @PayloadJson, SYSUTCDATETIME())"
      );
  } catch (error) {
    dbAvailable = false;
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[db] MSSQL unavailable, continuing with in-memory state: ${(error as Error).message}`);
    }
  }
}

export function databaseStatus(): { configured: boolean; available?: boolean } {
  return {
    configured: shouldUseMssql(),
    available: dbAvailable
  };
}

async function ensureLocalUser(pool: any): Promise<string> {
  if (localUserId) return localUserId;

  const existing = await pool
    .request()
    .input("Email", "local@ice-fit.dev")
    .query("SELECT TOP 1 UserId FROM dbo.Users WHERE Email = @Email ORDER BY CreatedAt ASC");

  if (existing.recordset.length > 0) {
    const userId = String(existing.recordset[0].UserId);
    localUserId = userId;
    return userId;
  }

  const inserted = await pool
    .request()
    .input("DisplayName", "Local User")
    .input("Email", "local@ice-fit.dev")
    .query(
      "INSERT INTO dbo.Users (DisplayName, Email) OUTPUT inserted.UserId VALUES (@DisplayName, @Email)"
    );

  const userId = String(inserted.recordset[0].UserId);
  localUserId = userId;
  return userId;
}

async function seedExercises(pool: any): Promise<void> {
  if (seededExercises) return;

  for (const exercise of exerciseLibrary) {
    await pool
      .request()
      .input("ExerciseId", exercise.id)
      .input("Name", exercise.name)
      .input("MovementPattern", exercise.movementPattern)
      .input("Category", exercise.category)
      .input("MusclesJson", JSON.stringify(exercise.muscles))
      .input("EquipmentJson", JSON.stringify(exercise.equipment))
      .input("AvoidWhenJson", JSON.stringify(exercise.avoidWhen))
      .input("Cue", exercise.cue)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseId = @ExerciseId)
        BEGIN
          INSERT INTO dbo.Exercises
            (ExerciseId, Name, MovementPattern, Category, MusclesJson, EquipmentJson, AvoidWhenJson, Cue)
          VALUES
            (@ExerciseId, @Name, @MovementPattern, @Category, @MusclesJson, @EquipmentJson, @AvoidWhenJson, @Cue)
        END
      `);
  }

  seededExercises = true;
}

async function persistDomainEvent(pool: any, userId: string, eventType: PersistableEvent, payload: any): Promise<void> {
  if (eventType === "profile_saved") {
    await saveProfile(pool, userId, payload.profile);
    await savePlan(pool, userId, payload.plan);
    return;
  }

  if (eventType === "plan_generated") {
    await savePlan(pool, userId, payload.plan);
    return;
  }

  if (eventType === "readiness_logged") {
    const readiness = payload.readiness;
    await pool
      .request()
      .input("UserId", userId)
      .input("Energy", readiness.energy)
      .input("Soreness", readiness.soreness)
      .input("Pain", readiness.pain)
      .input("TimeAvailable", readiness.timeAvailable)
      .input("Note", readiness.note ?? null)
      .query(`
        INSERT INTO dbo.ReadinessLogs (UserId, Energy, Soreness, Pain, TimeAvailable, Note)
        VALUES (@UserId, @Energy, @Soreness, @Pain, @TimeAvailable, @Note)
      `);
    return;
  }

  if (eventType === "set_logged") {
    const set = payload.set;
    await pool
      .request()
      .input("UserId", userId)
      .input("ExerciseId", set.exerciseId)
      .input("SetNumber", set.setNumber)
      .input("WeightKg", set.weightKg)
      .input("Reps", set.reps)
      .input("Effort", set.effort)
      .input("Pain", set.pain)
      .query(`
        INSERT INTO dbo.SetLogs (UserId, ExerciseId, SetNumber, WeightKg, Reps, Effort, Pain)
        VALUES (@UserId, @ExerciseId, @SetNumber, @WeightKg, @Reps, @Effort, @Pain)
      `);
    return;
  }

  if (eventType === "workout_completed") {
    await pool
      .request()
      .input("UserId", userId)
      .input("WorkoutDayId", payload.workoutDayId)
      .input("CompletedAt", payload.completedAt)
      .query(`
        INSERT INTO dbo.WorkoutLogs (UserId, WorkoutDayId, CompletedAt)
        VALUES (@UserId, @WorkoutDayId, @CompletedAt)
      `);
  }
}

async function saveProfile(pool: any, userId: string, profile: any): Promise<void> {
  await pool
    .request()
    .input("UserId", userId)
    .input("Goal", profile.goal)
    .input("Experience", profile.experience)
    .input("TrainingDays", profile.trainingDays)
    .input("EquipmentJson", JSON.stringify(profile.equipment ?? []))
    .input("BodyWeightKg", profile.bodyWeightKg ?? null)
    .input("HeightCm", profile.heightCm ?? null)
    .input("TargetWeightKg", profile.targetWeightKg ?? null)
    .input("InjuryFlagsJson", JSON.stringify(profile.injuryFlags ?? []))
    .input("PreferredSessionLength", profile.preferredSessionLength)
    .input("Notes", profile.notes ?? null)
    .query(`
      INSERT INTO dbo.UserProfiles
        (UserId, Goal, Experience, TrainingDays, EquipmentJson, BodyWeightKg, HeightCm, TargetWeightKg, InjuryFlagsJson, PreferredSessionLength, Notes)
      VALUES
        (@UserId, @Goal, @Experience, @TrainingDays, @EquipmentJson, @BodyWeightKg, @HeightCm, @TargetWeightKg, @InjuryFlagsJson, @PreferredSessionLength, @Notes)
    `);
}

async function savePlan(pool: any, userId: string, plan: any): Promise<void> {
  const planResult = await pool
    .request()
    .input("UserId", userId)
    .input("SplitName", plan.split)
    .input("Summary", plan.summary)
    .input("PlanJson", JSON.stringify(plan))
    .query(`
      INSERT INTO dbo.WorkoutPlans (UserId, SplitName, Summary, PlanJson)
      OUTPUT inserted.WorkoutPlanId
      VALUES (@UserId, @SplitName, @Summary, @PlanJson)
    `);

  const workoutPlanId = planResult.recordset[0].WorkoutPlanId;

  for (const day of plan.days ?? []) {
    await pool
      .request()
      .input("WorkoutPlanId", workoutPlanId)
      .input("DayIndex", day.dayIndex)
      .input("Name", day.name)
      .input("Focus", day.focus)
      .input("EstimatedDuration", day.estimatedDuration)
      .input("DayJson", JSON.stringify(day))
      .query(`
        INSERT INTO dbo.WorkoutDays (WorkoutPlanId, DayIndex, Name, Focus, EstimatedDuration, DayJson)
        VALUES (@WorkoutPlanId, @DayIndex, @Name, @Focus, @EstimatedDuration, @DayJson)
      `);
  }
}
