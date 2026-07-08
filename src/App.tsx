import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { LoadingState } from "./components/LoadingState";
import { api, post } from "./services/api";
import { CoachScreen } from "./screens/CoachScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { TodayScreen } from "./screens/TodayScreen";
import type { BootstrapPayload, ProgressSummary, TabId } from "./types/app";

const STORAGE_KEY = "ice-fit:onboarded";

const emptyProgress: ProgressSummary = {
  adherenceText: "No workouts completed yet",
  completedWorkouts: 0,
  streak: 0,
  consistencyScore: 0,
  strengthTrend: "Log your first session to start the trend.",
  personalRecords: ["First session waiting"],
  muscleVolume: [],
  aiInsight: "Start with one clean session and the trend will become useful."
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [progress, setProgress] = useState<ProgressSummary>(emptyProgress);
  const [loading, setLoading] = useState(true);
  const onboarded = window.localStorage.getItem(STORAGE_KEY) === "true";

  const refresh = useCallback(async () => {
    const next = await api<BootstrapPayload>("/api/workout/today");
    const summary = await api<ProgressSummary>("/api/progress/summary");
    setBootstrap(next);
    setProgress(summary);
  }, []);

  useEffect(() => {
    if (!onboarded) {
      setLoading(false);
      return;
    }

    refresh().finally(() => setLoading(false));
  }, [onboarded, refresh]);

  async function handleOnboardingComplete(payload: BootstrapPayload) {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setBootstrap(payload);
    setProgress(await api<ProgressSummary>("/api/progress/summary"));
  }

  async function regeneratePlan() {
    if (!bootstrap) return;
    const payload = await post<BootstrapPayload>("/api/workout/generate", { profile: bootstrap.profile });
    setBootstrap(payload);
    setProgress(await api<ProgressSummary>("/api/progress/summary"));
  }

  function restartOnboarding() {
    window.localStorage.removeItem(STORAGE_KEY);
    setBootstrap(null);
    setActiveTab("today");
  }

  if (loading) return <LoadingState label="Preparing coach" />;

  if (!onboarded || !bootstrap) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "today" ? (
        <TodayScreen profile={bootstrap.profile} plan={bootstrap.plan} today={bootstrap.today} onRefresh={refresh} />
      ) : null}
      {activeTab === "plan" ? <PlanScreen plan={bootstrap.plan} onRegenerate={regeneratePlan} /> : null}
      {activeTab === "progress" ? <ProgressScreen progress={progress} /> : null}
      {activeTab === "coach" ? <CoachScreen /> : null}
      {activeTab === "profile" ? <ProfileScreen profile={bootstrap.profile} onRestart={restartOnboarding} /> : null}
    </AppShell>
  );
}

