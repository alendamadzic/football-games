export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// UTC date string "YYYY-MM-DD" for keying daily results.
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
