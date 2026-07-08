import { ShieldCheck } from "lucide-react";

export function SafetyNote({ text }: { text: string }) {
  return (
    <aside className="safety-note">
      <ShieldCheck size={18} />
      <p>{text}</p>
    </aside>
  );
}

