import { Activity, BarChart3, Medal, Target, Zap } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { MobileHeader } from "../components/MobileHeader";
import type { ProgressSummary } from "../types/app";

interface ProgressScreenProps {
  progress: ProgressSummary;
}

export function ProgressScreen({ progress }: ProgressScreenProps) {
  return (
    <section className="screen-stack">
      <MobileHeader eyebrow="Progress" title="Training signal" meta={progress.adherenceText} />

      <div className="metric-grid two">
        <MetricCard label="Completed" value={`${progress.completedWorkouts}`} detail="workouts" icon={<Target size={18} />} />
        <MetricCard label="Streak" value={`${progress.streak}`} detail="sessions" icon={<Zap size={18} />} />
        <MetricCard label="Consistency" value={`${progress.consistencyScore}%`} detail="this cycle" icon={<Activity size={18} />} />
        <MetricCard label="Trend" value="Up" detail={progress.strengthTrend} icon={<BarChart3 size={18} />} />
      </div>

      <section className="progress-feature">
        <p className="eyebrow">Coach insight</p>
        <h2>{progress.aiInsight}</h2>
      </section>

      <section className="volume-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Volume</p>
            <h2>Muscle coverage</h2>
          </div>
        </div>
        {progress.muscleVolume.map((item) => (
          <div className="volume-row" key={item.muscle}>
            <span>{item.muscle}</span>
            <div className="volume-track">
              <span style={{ width: `${Math.min(100, item.sets * 9)}%` }} />
            </div>
            <strong>{labelStatus(item.status)}</strong>
          </div>
        ))}
      </section>

      <section className="records-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Personal records</p>
            <h2>Recent bests</h2>
          </div>
          <Medal size={20} />
        </div>
        {progress.personalRecords.map((record) => (
          <p key={record}>{record}</p>
        ))}
      </section>
    </section>
  );
}

function labelStatus(status: "low" | "on_track" | "high"): string {
  if (status === "low") return "Needs";
  if (status === "high") return "High";
  return "On track";
}

