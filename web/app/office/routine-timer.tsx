"use client";

import { useEffect, useState } from "react";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RoutineTimer({
  nextRunAt,
  intervalHours,
}: {
  nextRunAt: string;
  intervalHours: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(nextRunAt).getTime();
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const remainingMs = Math.max(0, target - now);
  const elapsedMs = Math.min(intervalMs, Math.max(0, intervalMs - remainingMs));
  const progress = intervalMs > 0 ? elapsedMs / intervalMs : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="routine-timer">
      <svg width="100" height="100" viewBox="0 0 100 100" className="routine-timer-ring">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="routine-timer-track" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          className="routine-timer-progress"
        />
      </svg>
      <div className="routine-timer-overlay">
        <div className="routine-timer-time">{formatDuration(remainingMs)}</div>
        <div className="routine-timer-sub">次の自動執筆まで</div>
      </div>
    </div>
  );
}
