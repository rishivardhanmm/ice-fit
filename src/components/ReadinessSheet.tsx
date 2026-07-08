import { BatteryMedium, Clock3, HeartPulse, X } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";

interface ReadinessSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { energy: number; soreness: number; pain: boolean; timeAvailable: number; note?: string }) => void;
}

export function ReadinessSheet({ open, onClose, onSubmit }: ReadinessSheetProps) {
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [pain, setPain] = useState(false);
  const [timeAvailable, setTimeAvailable] = useState(45);
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="sheet-backdrop">
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="readiness-title">
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <div>
            <p className="eyebrow">Readiness</p>
            <h2 id="readiness-title">Tune today</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close readiness check">
            <X size={20} />
          </button>
        </div>

        <label className="range-field">
          <span>
            <BatteryMedium size={18} /> Energy
          </span>
          <input type="range" min="1" max="5" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} />
          <strong>{energy}/5</strong>
        </label>

        <label className="range-field">
          <span>
            <HeartPulse size={18} /> Soreness
          </span>
          <input
            type="range"
            min="1"
            max="5"
            value={soreness}
            onChange={(event) => setSoreness(Number(event.target.value))}
          />
          <strong>{soreness}/5</strong>
        </label>

        <label className="range-field">
          <span>
            <Clock3 size={18} /> Time
          </span>
          <input
            type="range"
            min="20"
            max="90"
            step="5"
            value={timeAvailable}
            onChange={(event) => setTimeAvailable(Number(event.target.value))}
          />
          <strong>{timeAvailable}m</strong>
        </label>

        <button className={`pain-toggle ${pain ? "is-on" : ""}`} type="button" onClick={() => setPain((value) => !value)}>
          Pain today
          <span>{pain ? "Yes" : "No"}</span>
        </button>

        <textarea
          className="text-area"
          placeholder="Optional note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <PrimaryButton
          onClick={() => {
            onSubmit({ energy, soreness, pain, timeAvailable, note });
            onClose();
          }}
        >
          Apply readiness
        </PrimaryButton>
      </section>
    </div>
  );
}

