import { Database, Download, Lock, RefreshCw, Trash2 } from "lucide-react";
import { MobileHeader } from "../components/MobileHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import type { FitnessProfile } from "../types/app";

interface ProfileScreenProps {
  profile: FitnessProfile;
  onRestart: () => void;
}

export function ProfileScreen({ profile, onRestart }: ProfileScreenProps) {
  return (
    <section className="screen-stack">
      <MobileHeader eyebrow="Profile" title="Training settings" meta="Local single-user testing profile" />

      <section className="profile-card">
        <ProfileRow label="Goal" value={format(profile.goal)} />
        <ProfileRow label="Experience" value={format(profile.experience)} />
        <ProfileRow label="Training days" value={`${profile.trainingDays} per week`} />
        <ProfileRow label="Session length" value={`${profile.preferredSessionLength} minutes`} />
        <ProfileRow label="Body weight" value={profile.bodyWeightKg ? `${profile.bodyWeightKg} kg` : "Not set"} />
        <ProfileRow label="Height" value={profile.heightCm ? `${profile.heightCm} cm` : "Not set"} />
        {profile.goal === "fat_loss" ? (
          <ProfileRow label="Target weight" value={profile.targetWeightKg ? `${profile.targetWeightKg} kg` : "Not set"} />
        ) : null}
        <ProfileRow label="BMI" value={formatBmi(profile)} />
      </section>

      <section className="profile-card">
        <p className="eyebrow">Equipment</p>
        <div className="profile-chip-row">
          {profile.equipment.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="profile-card">
        <p className="eyebrow">Limitations</p>
        <div className="profile-chip-row">
          {profile.injuryFlags.length ? profile.injuryFlags.map((item) => <span key={item}>{item}</span>) : <span>None flagged</span>}
        </div>
      </section>

      <section className="privacy-panel">
        <Lock size={18} />
        <p>AI and database calls run on the laptop backend. The iPhone PWA only sends relative API requests to this app server.</p>
      </section>

      <div className="settings-list">
        <button type="button">
          <Database size={18} />
          Data export
          <Download size={16} />
        </button>
        <button type="button">
          <Trash2 size={18} />
          Delete local data
          <span>Local</span>
        </button>
      </div>

      <PrimaryButton variant="secondary" icon={<RefreshCw size={18} />} onClick={onRestart}>
        Rebuild profile
      </PrimaryButton>
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function format(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBmi(profile: FitnessProfile): string {
  if (!profile.bodyWeightKg || !profile.heightCm) return "Needs height and weight";
  const heightM = profile.heightCm / 100;
  return (profile.bodyWeightKg / (heightM * heightM)).toFixed(1);
}
