import type { ReactNode } from "react";
import { Activity, BarChart3, Bot, CalendarDays, UserRound } from "lucide-react";
import type { TabId } from "../types/app";

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: "today", label: "Today", icon: Activity },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "coach", label: "Coach", icon: Bot },
  { id: "profile", label: "Profile", icon: UserRound }
];

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      <nav className="bottom-tabs" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${selected ? "is-active" : ""}`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={21} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

