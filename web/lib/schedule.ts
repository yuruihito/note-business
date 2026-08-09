// The cloud routine runs on a fixed cron: 0 3,9,15,21 * * * (UTC) — every 6
// hours. Keep in sync with the routine's cron_expression if that ever changes.
const RUN_HOURS_UTC = [3, 9, 15, 21];
export const ROUTINE_INTERVAL_HOURS = 6;

export function nextRoutineRun(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  while (!(RUN_HOURS_UTC.includes(next.getUTCHours()) && next.getTime() > now.getTime())) {
    next.setUTCHours(next.getUTCHours() + 1);
  }
  return next;
}
