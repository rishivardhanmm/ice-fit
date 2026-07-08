import { useEffect, useState } from "react";
import { TimerReset } from "lucide-react";

interface RestTimerProps {
  active: boolean;
  seconds?: number;
  onDone?: () => void;
}

export function RestTimer({ active, seconds = 90, onDone }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          onDone?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, onDone, seconds]);

  if (!active) return null;

  const minutes = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");

  return (
    <div className="rest-timer">
      <TimerReset size={18} />
      <span>
        Rest {minutes}:{secs}
      </span>
    </div>
  );
}

