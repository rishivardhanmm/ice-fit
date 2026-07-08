import { CalendarCheck, CheckCircle2, ChevronRight, Clock3, Flame, Gauge, Play, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ExerciseCard } from "../components/ExerciseCard";
import { MetricCard } from "../components/MetricCard";
import { MobileHeader } from "../components/MobileHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { ReadinessSheet } from "../components/ReadinessSheet";
import { SafetyNote } from "../components/SafetyNote";
import { post } from "../services/api";
import type { BootstrapPayload, Effort, FitnessProfile, TodayWorkout, WorkoutPlan } from "../types/app";

interface TodayScreenProps {
  profile: FitnessProfile;
  plan: WorkoutPlan;
  today: TodayWorkout;
  onRefresh: () => Promise<void>;
}

export function TodayScreen({ profile, plan, today, onRefresh }: TodayScreenProps) {
  const [started, setStarted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const day = today.workoutDay;
  const loggingEnabled = started || today.progressPercent > 0;
  const primaryFocus = day.musclesCovered[0] ?? "Full body";
  const secondaryFocus = day.musclesCovered[1] ? `+ ${day.musclesCovered[1]}` : day.focus;
  const activeExercise = day.exercises[activeExerciseIndex] ?? day.exercises[0];
  const totalSets = useMemo(() => day.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0), [day.exercises]);
  const fullyLoggedExerciseIds = useMemo(
    () =>
      day.exercises
        .filter((exercise) => completedSetCount(exercise.exerciseId, today.completedSetIds) >= exercise.targetSets)
        .map((exercise) => exercise.exerciseId),
    [day.exercises, today.completedSetIds]
  );
  const completedExerciseIds = Array.from(new Set([...completedExercises, ...fullyLoggedExerciseIds]));
  const allExercisesDone = completedExerciseIds.length >= day.exercises.length;

  useEffect(() => {
    setActiveExerciseIndex(0);
    setCompletedExercises([]);
    setStarted(false);
  }, [day.id]);

  async function logSet(input: {
    workoutDayId: string;
    exerciseId: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    effort: Effort;
    pain: boolean;
  }) {
    await post("/api/workout/log", input);
    await onRefresh();
  }

  async function handleReadiness(input: { energy: number; soreness: number; pain: boolean; timeAvailable: number; note?: string }) {
    await post("/api/readiness", input);
    await onRefresh();
  }

  async function handleSubstitute(exerciseId: string): Promise<string> {
    const response = await post<{ reason: string; replacement?: { name: string } }>("/api/workout/substitute", { exerciseId });
    return response.replacement ? `${response.reason} Suggested: ${response.replacement.name}.` : response.reason;
  }

  async function finishWorkout() {
    setFinishing(true);
    try {
      await post("/api/workout/complete", { workoutDayId: day.id });
      await onRefresh();
      setStarted(false);
    } finally {
      setFinishing(false);
    }
  }

  function selectExercise(index: number) {
    setActiveExerciseIndex(index);
    setStarted(true);
  }

  function completeActiveExercise() {
    if (!activeExercise) return;

    const nextCompleted = Array.from(new Set([...completedExerciseIds, activeExercise.exerciseId]));
    setCompletedExercises(nextCompleted);

    const nextIndex = day.exercises.findIndex(
      (exercise, index) => index !== activeExerciseIndex && !nextCompleted.includes(exercise.exerciseId)
    );

    if (nextIndex >= 0) {
      setActiveExerciseIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="screen-stack">
      <MobileHeader eyebrow={todayLabel()} title={`Ready, ${displayName(profile)}`} meta={plan.split} />

      <section className="today-hero">
        <div className="hero-copy">
          <p className="eyebrow">Today</p>
          <h2>{day.name}</h2>
          <p>{day.focus}</p>
        </div>
        <div className="progress-orbit" style={{ "--progress": `${today.progressPercent}%` } as CSSProperties}>
          <strong>{today.progressPercent}%</strong>
          <span>done</span>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="Duration" value={`${day.estimatedDuration}m`} icon={<Clock3 size={18} />} />
        <MetricCard label="Sets" value={`${today.completedSetIds.length}/${totalSets}`} icon={<CalendarCheck size={18} />} />
        <MetricCard label="Focus" value={primaryFocus} detail={secondaryFocus} icon={<Flame size={18} />} />
      </div>

      <div className="readiness-card">
        <div>
          <p className="eyebrow">Readiness</p>
          <h3>
            {today.readiness
              ? `${today.readiness.energy}/5 energy, ${today.readiness.timeAvailable}m available`
              : "Check in before loading up"}
          </h3>
        </div>
        <button className="icon-text-button" type="button" onClick={() => setSheetOpen(true)}>
          <Gauge size={17} />
          Tune
        </button>
      </div>

      <div className="sticky-action">
        {!loggingEnabled ? (
          <PrimaryButton icon={<Play size={18} />} onClick={() => setStarted(true)}>
            Start workout
          </PrimaryButton>
        ) : (
          <PrimaryButton icon={<Trophy size={18} />} onClick={finishWorkout} disabled={finishing}>
            Finish workout
          </PrimaryButton>
        )}
      </div>

      {!loggingEnabled ? (
        <section className="workout-card-list">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Workout cards</p>
              <h2>Tap a movement when you are ready</h2>
            </div>
          </div>
          {day.exercises.map((exercise, index) => (
            <WorkoutQueueCard
              key={exercise.prescriptionId}
              exercise={exercise}
              index={index}
              active={false}
              completed={completedExerciseIds.includes(exercise.exerciseId)}
              setCount={completedSetCount(exercise.exerciseId, today.completedSetIds)}
              onSelect={() => selectExercise(index)}
            />
          ))}
        </section>
      ) : (
        <section className="session-flow">
          <div className="session-flow-top">
            <div>
              <p className="eyebrow">Now logging</p>
              <h2>{allExercisesDone ? "Session ready to finish" : activeExercise?.name}</h2>
            </div>
            <span>
              {completedExerciseIds.length}/{day.exercises.length}
            </span>
          </div>

          {allExercisesDone ? (
            <section className="done-panel">
              <CheckCircle2 size={28} />
              <h2>All workout cards are complete.</h2>
              <p>Finish the workout to save the session and update progress.</p>
              <PrimaryButton icon={<Trophy size={18} />} onClick={finishWorkout} disabled={finishing}>
                Finish workout
              </PrimaryButton>
            </section>
          ) : activeExercise ? (
            <ExerciseCard
              key={activeExercise.prescriptionId}
              exercise={activeExercise}
              workoutDayId={day.id}
              completedSetIds={today.completedSetIds}
              loggingEnabled={loggingEnabled}
              index={activeExerciseIndex}
              total={day.exercises.length}
              onCompleteExercise={completeActiveExercise}
              onLogSet={logSet}
              onSubstitute={handleSubstitute}
            />
          ) : null}

          <div className="exercise-queue">
            {day.exercises.map((exercise, index) => (
              <WorkoutQueueCard
                key={exercise.prescriptionId}
                exercise={exercise}
                index={index}
                active={index === activeExerciseIndex && !allExercisesDone}
                completed={completedExerciseIds.includes(exercise.exerciseId)}
                setCount={completedSetCount(exercise.exerciseId, today.completedSetIds)}
                onSelect={() => selectExercise(index)}
              />
            ))}
          </div>
        </section>
      )}

      <SafetyNote text={today.safetyNote} />

      <PrimaryButton variant="ghost" icon={<RotateCcw size={17} />} onClick={onRefresh}>
        Refresh workout
      </PrimaryButton>

      <ReadinessSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSubmit={handleReadiness} />
    </section>
  );
}

function WorkoutQueueCard({
  exercise,
  index,
  active,
  completed,
  setCount,
  onSelect
}: {
  exercise: TodayWorkout["workoutDay"]["exercises"][number];
  index: number;
  active: boolean;
  completed: boolean;
  setCount: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`workout-queue-card ${active ? "is-active" : ""} ${completed ? "is-complete" : ""}`}
      onClick={onSelect}
    >
      <span className="queue-index">{completed ? <CheckCircle2 size={18} /> : index + 1}</span>
      <span className="queue-main">
        <strong>{exercise.name}</strong>
        <small>
          {exercise.movementCategory} · {exercise.targetSets} x {exercise.repRange}
        </small>
      </span>
      <span className="queue-meta">
        {setCount}/{exercise.targetSets}
        <ChevronRight size={16} />
      </span>
    </button>
  );
}

function completedSetCount(exerciseId: string, completedSetIds: string[]): number {
  return completedSetIds.filter((id) => id.startsWith(`${exerciseId}-`)).length;
}

function todayLabel(): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date());
}

function displayName(profile: FitnessProfile): string {
  if (profile.goal === "strength") return "strong one";
  if (profile.goal === "fat_loss") return "steady mover";
  return "athlete";
}
