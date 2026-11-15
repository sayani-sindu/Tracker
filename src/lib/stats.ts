import { addDays, diffDays } from './dates';

// Consecutive done days ending at `asOf`. If `asOf` is not done yet, the run may end the day before.
export function currentStreak(done: Set<string>, asOf: string): number {
  let cursor = done.has(asOf) ? asOf : addDays(asOf, -1);
  let count = 0;
  while (done.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function bestStreak(dates: string[]): number {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && diffDays(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// Share of days done in the last `days` days, not counting days before the habit existed
export function completionRate(
  done: Set<string>,
  createdOn: string,
  today: string,
  days: number,
): number {
  const windowStart = addDays(today, -(days - 1));
  const from = createdOn > windowStart ? createdOn : windowStart;
  const span = diffDays(from, today) + 1;
  if (span <= 0) return 0;
  let hits = 0;
  for (let i = 0; i < span; i++) {
    if (done.has(addDays(from, i))) hits++;
  }
  return hits / span;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}