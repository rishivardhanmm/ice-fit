import { Check, Copy, History, Minus, Plus, Replace, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { Effort, ExercisePrescription } from "../types/app";
import { PrimaryButton } from "./PrimaryButton";
import { RestTimer } from "./RestTimer";

interface ExerciseCardProps {
  exercise: ExercisePrescription;
  workoutDayId: string;
  completedSetIds: string[];
  loggingEnabled: boolean;
  index?: number;
  total?: number;
  onCompleteExercise?: () => void;
  onLogSet: (input: {
    workoutDayId: string;
    exerciseId: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    effort: Effort;
    pain: boolean;
  }) => Promise<void>;
  onSubstitute: (exerciseId: string) => Promise<string>;
}

interface SetDraft {
  weightKg: number;
  reps: number;
  effort: Effort;
  pain: boolean;
}

const efforts: Effort[] = ["easy", "good", "hard", "max"];

export function ExerciseCard({
  exercise,
  workoutDayId,
  completedSetIds,
  loggingEnabled,
  index,
  total,
  onCompleteExercise,
  onLogSet,
  onSubstitute
}: ExerciseCardProps) {
  const [drafts, setDrafts] = useState<SetDraft[]>(() =>
    Array.from({ length: exercise.targetSets }, () => ({
      weightKg: exercise.suggestedWeightKg ?? 0,
      reps: Number(exercise.repRange.split("-")[0] ?? 8),
      effort: "good" as Effort,
      pain: false
    }))
  );
  const [resting, setResting] = useState(false);
  const [substituteText, setSubstituteText] = useState("");
  const [completedDrafts, setCompletedDrafts] = useState<Array<SetDraft | undefined>>([]);

  const completedCount = useMemo(
    () => completedSetIds.filter((id) => id.startsWith(`${exercise.exerciseId}-`)).length,
    [completedSetIds, exercise.exerciseId]
  );
  const activeSetIndex = Math.min(completedCount, Math.max(0, drafts.length - 1));
  const activeDraft = drafts[activeSetIndex];

  function updateDraft(index: number, patch: Partial<SetDraft>) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)));
  }

  function copyPrevious(index: number) {
    const previous = drafts[Math.max(0, index - 1)];
    updateDraft(index, previous);
  }

  async function completeSet(index: number) {
    const draft = drafts[index];
    if (!draft || completedSetIds.includes(`${exercise.exerciseId}-${index + 1}`)) return;

    await onLogSet({
      workoutDayId,
      exerciseId: exercise.exerciseId,
      setNumber: index + 1,
      weightKg: draft.weightKg,
      reps: draft.reps,
      effort: draft.effort,
      pain: draft.pain
    });
    setCompletedDrafts((current) => {
      const next = [...current];
      next[index] = draft;
      return next;
    });
    setDrafts((current) =>
      current.map((item, draftIndex) => {
        if (draftIndex === index + 1 && item.weightKg === (exercise.suggestedWeightKg ?? 0)) {
          return { ...draft };
        }
        return item;
      })
    );
    setResting(true);
  }

  return (
    <article className="exercise-card">
      <div className="exercise-topline">
        <div>
          <p className="eyebrow">
            {typeof index === "number" && total ? `Exercise ${index + 1} of ${total}` : exercise.movementCategory}
          </p>
          <h3>{exercise.name}</h3>
          {typeof index === "number" && total ? <p className="exercise-subtitle">{exercise.movementCategory}</p> : null}
        </div>
        <span className="set-pill">
          {completedCount}/{exercise.targetSets}
        </span>
      </div>

      <div className="exercise-targets">
        <div>
          <span>Target</span>
          <strong>
            {exercise.targetSets} x {exercise.repRange}
          </strong>
        </div>
        <div>
          <span>Suggested</span>
          <strong>{exercise.suggestedWeightKg ? `${exercise.suggestedWeightKg} kg` : "Bodyweight"}</strong>
        </div>
        <div>
          <span>Last</span>
          <strong>{exercise.lastPerformance}</strong>
        </div>
      </div>

      <p className="coach-cue">{exercise.note}</p>

      <div className="exercise-actions">
        <button className="icon-text-button" type="button" onClick={async () => setSubstituteText(await onSubstitute(exercise.exerciseId))}>
          <Replace size={17} />
          Swap
        </button>
        <button className="icon-text-button" type="button">
          <History size={17} />
          History
        </button>
      </div>

      {substituteText ? <p className="substitute-note">{substituteText}</p> : null}

      {loggingEnabled ? (
        <>
          <div className="set-flow" aria-label={`${exercise.name} set logger`}>
            <div className="set-progress-strip" aria-label={`${completedCount} of ${exercise.targetSets} sets complete`}>
              {drafts.map((_draft, setIndex) => {
                const completed = completedSetIds.includes(`${exercise.exerciseId}-${setIndex + 1}`);
                const active = setIndex === activeSetIndex && completedCount < drafts.length;
                return (
                  <span className={`${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`} key={setIndex}>
                    {setIndex + 1}
                  </span>
                );
              })}
            </div>

            {completedCount > 0 ? (
              <div className="completed-set-strip" aria-label="Completed sets">
                {drafts.slice(0, completedCount).map((draft, setIndex) => {
                  const savedDraft = completedDrafts[setIndex] ?? draft;
                  return (
                    <span key={`${exercise.exerciseId}-done-${setIndex}`}>
                      Set {setIndex + 1}: {savedDraft.weightKg} kg x {savedDraft.reps}
                    </span>
                  );
                })}
              </div>
            ) : null}

            {completedCount < drafts.length && activeDraft ? (
              <section className="active-set-card">
                <div className="active-set-head">
                  <div>
                    <p className="eyebrow">Current set</p>
                    <h4>Set {activeSetIndex + 1}</h4>
                  </div>
                  <span>{exercise.repRange} reps</span>
                </div>

                <div className="set-input-grid">
                  <StepperField
                    label="Weight"
                    value={activeDraft.weightKg}
                    suffix="kg"
                    step={1}
                    onChange={(value) => updateDraft(activeSetIndex, { weightKg: value })}
                  />
                  <StepperField
                    label="Reps"
                    value={activeDraft.reps}
                    step={1}
                    onChange={(value) => updateDraft(activeSetIndex, { reps: value })}
                  />
                </div>

                <div className="effort-control" role="group" aria-label={`Set ${activeSetIndex + 1} effort`}>
                  {efforts.map((effort) => (
                    <button
                      key={effort}
                      type="button"
                      className={activeDraft.effort === effort ? "is-active" : ""}
                      onClick={() => updateDraft(activeSetIndex, { effort })}
                    >
                      {effort}
                    </button>
                  ))}
                </div>

                <div className="active-set-actions">
                  <button
                    type="button"
                    className={`pain-toggle-button ${activeDraft.pain ? "is-on" : ""}`}
                    onClick={() => updateDraft(activeSetIndex, { pain: !activeDraft.pain })}
                  >
                    <ShieldAlert size={17} />
                    {activeDraft.pain ? "Pain flagged" : "No pain"}
                  </button>

                  {activeSetIndex > 0 ? (
                    <button type="button" className="copy-set-button" onClick={() => copyPrevious(activeSetIndex)}>
                      <Copy size={17} />
                      Copy previous
                    </button>
                  ) : null}
                </div>

                <PrimaryButton icon={<Check size={18} />} onClick={() => completeSet(activeSetIndex)}>
                  Complete set {activeSetIndex + 1}
                </PrimaryButton>
              </section>
            ) : (
              <section className="all-sets-done">
                <Check size={20} />
                <div>
                  <h4>All sets logged</h4>
                  <p>Complete this exercise when you are ready to move on.</p>
                </div>
              </section>
            )}
          </div>

          <RestTimer active={resting} onDone={() => setResting(false)} />

          <PrimaryButton
            variant={completedCount >= drafts.length ? "primary" : "ghost"}
            className="exercise-finish-button"
            onClick={onCompleteExercise}
          >
            {completedCount >= drafts.length ? "Complete exercise" : "Move to next"}
          </PrimaryButton>
        </>
      ) : null}
    </article>
  );
}

function StepperField({
  label,
  value,
  suffix,
  step,
  onChange
}: {
  label: string;
  value: number;
  suffix?: string;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stepper-field">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(0, roundOne(value - step)))} aria-label={`Decrease ${label}`}>
          <Minus size={17} />
        </button>
        <label>
          <input inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value))} />
          {suffix ? <small>{suffix}</small> : null}
        </label>
        <button type="button" onClick={() => onChange(roundOne(value + step))} aria-label={`Increase ${label}`}>
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
