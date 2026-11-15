import AsyncStorage from '@react-native-async-storage/async-storage';

export const CYCLE_DAYS = 21;

export type HabitId =
  | 'wake'
  | 'noInstagram'
  | 'gym'
  | 'priorityWork'
  | 'noOvertime'
  | 'learning'
  | 'read'
  | 'sleep';

export type Habit = {
  id: HabitId;
  title: string;
  hint: string;
};

export const HABITS: Habit[] = [
  { id: 'wake', title: 'Wake up by 7 AM', hint: 'Start the morning on time' },
  { id: 'noInstagram', title: 'No morning Instagram', hint: 'Phone stays away until the routine is done' },
  { id: 'gym', title: 'Complete gym session', hint: 'Slot is 8–9 AM' },
  { id: 'priorityWork', title: 'Complete priority work', hint: 'Finish the most important task first' },
  { id: 'noOvertime', title: 'Avoid unnecessary overtime', hint: 'Aim to close by 6:30 PM' },
  { id: 'learning', title: 'Learning / career growth', hint: '30–60 minutes when workload allows' },
  { id: 'read', title: 'Read for 10 minutes', hint: 'A book, not a screen' },
  { id: 'sleep', title: 'Sleep by 11 PM', hint: 'Start winding down at 10 PM' },
];

// One day's check-offs, e.g. { wake: true, gym: false }
export type DayLog = Partial<Record<HabitId, boolean>>;

// Keyed by local date, e.g. "2026-11-15"
export type Logs = Record<string, DayLog>;

export type AppState = {
  startKey: string | null;
  logs: Logs;
};

const LOGS_KEY = 'tracker:v1:logs';
const START_KEY = 'tracker:v1:startKey';

// ---------- Dates (local time, never UTC) ----------

export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const date = keyToDate(key);
  date.setDate(date.getDate() + n);
  return toDateKey(date);
}

// Returns 1 on the start day, 2 the next day, and so on
export function dayNumber(startKey: string, todayKey: string): number {
  const ms = keyToDate(todayKey).getTime() - keyToDate(startKey).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

// ---------- Logic ----------

export function toggleHabit(logs: Logs, dateKey: string, id: HabitId): Logs {
  const day = logs[dateKey] ?? {};
  return { ...logs, [dateKey]: { ...day, [id]: !day[id] } };
}

export function countDone(log: DayLog | undefined): number {
  if (!log) return 0;
  return HABITS.filter(h => log[h.id]).length;
}

// ---------- Storage ----------

export async function loadState(): Promise<AppState> {
  const [[, logsRaw], [, startKey]] = await AsyncStorage.multiGet([LOGS_KEY, START_KEY]);
  return {
    logs: logsRaw ? (JSON.parse(logsRaw) as Logs) : {},
    startKey,
  };
}

export async function saveLogs(logs: Logs): Promise<void> {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function saveStartKey(startKey: string): Promise<void> {
  await AsyncStorage.setItem(START_KEY, startKey);
}