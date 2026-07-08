import { ArrowLeft, ArrowRight, Check, Dumbbell, Sparkles, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { PrimaryButton } from "../components/PrimaryButton";
import { post } from "../services/api";
import type { AiProfileParse, BootstrapPayload, Experience, FitnessProfile, Goal, WorkoutPlan } from "../types/app";

interface OnboardingScreenProps {
  onComplete: (payload: BootstrapPayload) => void;
}

const goals: Array<{ id: Goal; label: string; detail: string }> = [
  { id: "fat_loss", label: "Lose fat", detail: "Strength plus energy cost" },
  { id: "muscle_gain", label: "Build muscle", detail: "Balanced weekly volume" },
  { id: "strength", label: "Get stronger", detail: "Skillful heavy practice" },
  { id: "general_fitness", label: "Feel fitter", detail: "Simple consistency" },
  { id: "return_to_training", label: "Return safely", detail: "Lower friction rebuild" }
];

const experiences: Array<{ id: Experience; label: string }> = [
  { id: "beginner", label: "Beginner" },
  { id: "novice", label: "Novice" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" }
];

const equipmentOptions = ["bodyweight", "dumbbells", "bench", "barbell", "cable", "bands", "machine", "bike", "treadmill"];
const injuryOptions = [
  { id: "knee_pain", label: "Knee" },
  { id: "shoulder_pain", label: "Shoulder" },
  { id: "back_pain", label: "Back" },
  { id: "wrist_pain", label: "Wrist" },
  { id: "elbow_pain", label: "Elbow" }
];

const stepTitles = [
  "Welcome",
  "Goal",
  "Experience",
  "Training days",
  "Equipment",
  "Body metrics",
  "Limitations",
  "Session length",
  "AI summary"
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [aiParse, setAiParse] = useState<AiProfileParse | null>(null);
  const [profile, setProfile] = useState<FitnessProfile>({
    userId: "local-user",
    goal: "general_fitness",
    experience: "beginner",
    trainingDays: 3,
    equipment: ["bodyweight", "dumbbells", "bench"],
    injuryFlags: [],
    preferredSessionLength: 45,
    notes: ""
  });

  const progress = useMemo(() => Math.round(((step + 1) / stepTitles.length) * 100), [step]);
  const bmi = calculateBmi(profile.bodyWeightKg, profile.heightCm);
  const targetBmi = calculateBmi(profile.targetWeightKg, profile.heightCm);

  function patchProfile(patch: Partial<FitnessProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function toggleArray(field: "equipment" | "injuryFlags", value: string) {
    setProfile((current) => {
      const source = current[field];
      const next = source.includes(value) ? source.filter((item) => item !== value) : [...source, value];
      return { ...current, [field]: next };
    });
  }

  async function parseNaturalLanguage() {
    if (!freeText.trim()) return;
    setLoading(true);
    try {
      const response = await post<{ profile: AiProfileParse }>("/api/onboarding/parse", {
        text: freeText
      });
      setAiParse(response.profile);
      patchProfile({ ...response.profile, notes: freeText });
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setLoading(true);
    try {
      const payload = await post<BootstrapPayload & { plan: WorkoutPlan }>("/api/workout/generate", { profile });
      onComplete(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="onboarding-screen">
      <section className="onboarding-card">
        <div className="onboarding-progress" aria-label={`Onboarding ${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-top">
          <div className="app-mark">
            <Dumbbell size={24} />
          </div>
          <div>
            <p className="eyebrow">Ice Fit</p>
            <h1>{stepTitles[step]}</h1>
          </div>
        </div>

        {step === 0 ? (
          <div className="onboarding-panel">
            <h2>Build a plan that adapts to how you train.</h2>
            <p>
              Start with a few choices, or describe what you want and the coach will structure a profile for you.
            </p>
            <textarea
              className="text-area large"
              placeholder="I want to lose fat, I have dumbbells, I can train 3 days, and my knees hurt sometimes."
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
            />
            <PrimaryButton icon={<Sparkles size={18} />} onClick={parseNaturalLanguage} disabled={loading || !freeText.trim()}>
              Parse my notes
            </PrimaryButton>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="option-list">
            <AiChoiceBanner
              aiParse={aiParse}
              value={labelGoal(profile.goal)}
              reason={aiParse?.rationale.goal}
              confidence={aiParse?.confidence}
            />
            {goals.map((goal) => (
              <button
                key={goal.id}
                className={`choice-card ${profile.goal === goal.id ? "is-selected" : ""}`}
                type="button"
                onClick={() => patchProfile({ goal: goal.id })}
              >
                <span>{goal.label}</span>
                <small>{goal.detail}</small>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="segmented-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value={profile.experience}
              reason={aiParse?.rationale.experience}
              confidence={aiParse?.confidence}
            />
            {experiences.map((experience) => (
              <button
                key={experience.id}
                type="button"
                className={profile.experience === experience.id ? "is-active" : ""}
                onClick={() => patchProfile({ experience: experience.id })}
              >
                {experience.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="onboarding-step-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value={`${profile.trainingDays} days`}
              reason={aiParse?.rationale.trainingDays}
              confidence={aiParse?.confidence}
            />
            <div className="number-picker">
              {[2, 3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={profile.trainingDays === days ? "is-selected" : ""}
                  onClick={() => patchProfile({ trainingDays: days })}
                >
                  <strong>{days}</strong>
                  <span>days</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="onboarding-step-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value={profile.equipment.join(", ")}
              reason={aiParse?.rationale.equipment}
              confidence={aiParse?.confidence}
            />
            <div className="chip-grid">
              {equipmentOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={profile.equipment.includes(item) ? "is-selected" : ""}
                  onClick={() => toggleArray("equipment", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="form-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value={bodyMetricLabel(profile)}
              reason={bodyMetricReason(aiParse)}
              confidence={aiParse?.confidence}
            />
            <div className="body-metric-grid">
              <label>
                <span>Current weight</span>
                <input
                  inputMode="decimal"
                  placeholder="kg"
                  value={profile.bodyWeightKg ?? ""}
                  onChange={(event) => patchProfile({ bodyWeightKg: positiveInput(event.target.value) })}
                />
              </label>
              <label>
                <span>Height</span>
                <input
                  inputMode="decimal"
                  placeholder="cm"
                  value={profile.heightCm ?? ""}
                  onChange={(event) => patchProfile({ heightCm: positiveInput(event.target.value) })}
                />
              </label>
            </div>

            {profile.goal === "fat_loss" ? (
              <label>
                <span>Fat-loss target</span>
                <input
                  inputMode="decimal"
                  placeholder="Goal weight in kg"
                  value={profile.targetWeightKg ?? ""}
                  onChange={(event) => patchProfile({ targetWeightKg: positiveInput(event.target.value) })}
                />
              </label>
            ) : null}

            <BodyInsight bmi={bmi} targetBmi={targetBmi} profile={profile} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="onboarding-step-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value={profile.injuryFlags.length ? profile.injuryFlags.join(", ") : "None flagged"}
              reason={aiParse?.rationale.injuryFlags}
              confidence={aiParse?.confidence}
            />
            <div className="chip-grid">
              {injuryOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={profile.injuryFlags.includes(item.id) ? "is-selected" : ""}
                  onClick={() => toggleArray("injuryFlags", item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="session-slider">
            <AiChoiceBanner
              aiParse={aiParse}
              value={`${profile.preferredSessionLength} minutes`}
              reason={aiParse?.rationale.preferredSessionLength}
              confidence={aiParse?.confidence}
            />
            <strong>{profile.preferredSessionLength} minutes</strong>
            <input
              type="range"
              min="25"
              max="90"
              step="5"
              value={profile.preferredSessionLength}
              onChange={(event) => patchProfile({ preferredSessionLength: Number(event.target.value) })}
            />
          </div>
        ) : null}

        {step === 8 ? (
          <div className="onboarding-step-stack">
            <AiChoiceBanner
              aiParse={aiParse}
              value="Ready to generate"
              reason="Review the AI choices, edit anything that feels off, then generate the deterministic plan."
              confidence={aiParse?.confidence}
            />
            <div className="summary-panel">
              <div>
                <span>Goal</span>
                <strong>{labelGoal(profile.goal)}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{profile.experience}</strong>
              </div>
              <div>
                <span>Schedule</span>
                <strong>
                  {profile.trainingDays} days, {profile.preferredSessionLength}m
                </strong>
              </div>
              <div>
                <span>Equipment</span>
                <strong>{profile.equipment.join(", ")}</strong>
              </div>
              <div>
                <span>Body</span>
                <strong>{bodyMetricLabel(profile)}</strong>
              </div>
              {profile.goal === "fat_loss" ? (
                <div>
                  <span>Fat-loss goal</span>
                  <strong>{profile.targetWeightKg ? `${profile.targetWeightKg} kg target` : "Ask me for a target"}</strong>
                </div>
              ) : null}
              <div>
                <span>Limitations</span>
                <strong>{profile.injuryFlags.length ? profile.injuryFlags.join(", ") : "None flagged"}</strong>
              </div>
            </div>
          </div>
        ) : null}

        <div className="onboarding-actions">
          <button className="icon-button" type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
            <ArrowLeft size={20} />
          </button>

          {step < 8 ? (
            <PrimaryButton icon={<ArrowRight size={18} />} onClick={() => setStep((value) => Math.min(8, value + 1))}>
              Continue
            </PrimaryButton>
          ) : (
            <PrimaryButton icon={<Check size={18} />} onClick={generatePlan} disabled={loading}>
              Generate plan
            </PrimaryButton>
          )}
        </div>
      </section>
    </main>
  );
}

function BodyInsight({
  bmi,
  targetBmi,
  profile
}: {
  bmi?: number;
  targetBmi?: number;
  profile: FitnessProfile;
}) {
  if (!profile.bodyWeightKg || !profile.heightCm) {
    return (
      <section className="body-insight-card">
        <p className="eyebrow">Body context</p>
        <h2>Height and weight are needed for BMI.</h2>
        <p>The app will not assume these. Add them only if you want body-size context in the plan.</p>
      </section>
    );
  }

  return (
    <section className="body-insight-card">
      <p className="eyebrow">BMI context</p>
      <h2>{bmi?.toFixed(1)} BMI</h2>
      <p>{bmiCategoryCopy(bmi)}</p>
      {profile.goal === "fat_loss" ? (
        <p>
          {profile.targetWeightKg && targetBmi
            ? `At ${profile.targetWeightKg} kg, your BMI would be ${targetBmi.toFixed(1)}. Use this as a planning signal, not a medical diagnosis.`
            : "For fat loss, add a realistic target weight or leave it blank and focus on adherence first."}
        </p>
      ) : null}
    </section>
  );
}

function AiChoiceBanner({
  aiParse,
  value,
  reason,
  confidence
}: {
  aiParse: AiProfileParse | null;
  value: string;
  reason?: string;
  confidence?: number;
}) {
  if (!aiParse) return null;

  return (
    <section className="ai-choice-banner">
      <div className="ai-choice-icon">
        <WandSparkles size={18} />
      </div>
      <div>
        <p className="eyebrow">AI chose</p>
        <h2>{value}</h2>
        <p>{reason}</p>
        {typeof confidence === "number" ? <span>{Math.round(confidence * 100)}% confidence</span> : null}
      </div>
    </section>
  );
}

function labelGoal(goal: Goal): string {
  return goals.find((item) => item.id === goal)?.label ?? goal;
}

function positiveInput(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function calculateBmi(weightKg?: number, heightCm?: number): number | undefined {
  if (!weightKg || !heightCm) return undefined;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bodyMetricLabel(profile: FitnessProfile): string {
  const weight = profile.bodyWeightKg ? `${profile.bodyWeightKg} kg` : "weight not set";
  const height = profile.heightCm ? `${profile.heightCm} cm` : "height not set";
  return `${weight}, ${height}`;
}

function bodyMetricReason(aiParse: AiProfileParse | null): string | undefined {
  if (!aiParse) return undefined;
  return `${aiParse.rationale.bodyWeightKg} ${aiParse.rationale.heightCm} ${aiParse.rationale.targetWeightKg}`;
}

function bmiCategoryCopy(bmi?: number): string {
  if (!bmi) return "BMI will appear after height and weight are entered.";
  if (bmi < 18.5) return "This is below the standard BMI reference range. Avoid aggressive weight loss.";
  if (bmi < 25) return "This is within the standard BMI reference range. Performance and body composition may matter more than scale weight.";
  if (bmi < 30) return "This is above the standard BMI reference range. A gradual fat-loss goal may be reasonable if that matches your preference.";
  return "This is well above the standard BMI reference range. Keep goals gradual and consider professional guidance for health context.";
}
