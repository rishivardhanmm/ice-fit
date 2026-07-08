import { AlertTriangle, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileHeader } from "../components/MobileHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { post } from "../services/api";
import type { WorkoutPlan } from "../types/app";

interface PlanScreenProps {
  plan: WorkoutPlan;
  onRegenerate: () => Promise<void>;
}

export function PlanScreen({ plan, onRegenerate }: PlanScreenProps) {
  const [explanation, setExplanation] = useState(plan.summary);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let alive = true;
    post<{ text: string }>("/api/ai/plan-explanation")
      .then((response) => {
        if (alive) setExplanation(response.text);
      })
      .catch(() => setExplanation(plan.summary));
    return () => {
      alive = false;
    };
  }, [plan.id, plan.summary]);

  async function regenerate() {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <section className="screen-stack">
      <MobileHeader eyebrow="Weekly plan" title={plan.split} meta={plan.summary} />

      <section className="insight-panel">
        <Sparkles size={20} />
        <div>
          <p className="eyebrow">Why this plan?</p>
          <p>{explanation}</p>
        </div>
      </section>

      <div className="plan-days">
        {plan.days.map((day) => (
          <article className="plan-day-card" key={day.id}>
            <div className="plan-day-index">
              <CalendarDays size={18} />
              <span>Day {day.dayIndex + 1}</span>
            </div>
            <h2>{day.name}</h2>
            <p>{day.focus}</p>
            <div className="plan-day-meta">
              <span>{day.estimatedDuration} min</span>
              <span>{day.exercises.length} movements</span>
            </div>
            <div className="muscle-strip">
              {day.musclesCovered.slice(0, 5).map((muscle) => (
                <span key={muscle}>{muscle}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="warning-panel">
        <AlertTriangle size={18} />
        <p>Regenerating replaces the current structure. Keep this when the plan is already working.</p>
      </section>

      <PrimaryButton icon={<RefreshCw size={18} />} onClick={regenerate} disabled={regenerating}>
        Regenerate plan
      </PrimaryButton>
    </section>
  );
}

