import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  Habit,
  fetchCompletions,
  fetchHabits,
  fetchNotes,
  insertHabit,
  removeHabit,
  setCompletion,
  setDayNote,
  updateHabit,
} from './db';
import { toDateKey } from './lib/dates';

type DoneMap = Record<string, Set<string>>;

export type HabitInput = {
  id?: string;
  name: string;
  note: string;
  archived: boolean;
};

type StoreValue = {
  ready: boolean;
  habits: Habit[];
  activeHabits: Habit[];
  notes: Record<string, string>;
  datesFor: (habitId: string) => Set<string>;
  isDone: (habitId: string, date: string) => boolean;
  toggle: (habitId: string, date: string) => Promise<void>;
  saveHabit: (input: HabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  saveNote: (date: string, body: string) => Promise<void>;
};

const EMPTY_SET = new Set<string>();
const StoreContext = createContext<StoreValue | null>(null);

function errorText(e: unknown): string {
  return (e as { message?: string })?.message ?? String(e);
}

export function DataProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<DoneMap>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reloadHabits = useCallback(async () => {
    const [loadedHabits, completions] = await Promise.all([fetchHabits(), fetchCompletions()]);
    const map: DoneMap = {};
    for (const row of completions) {
      if (!map[row.habitId]) map[row.habitId] = new Set<string>();
      map[row.habitId].add(row.date);
    }
    setHabits(loadedHabits);
    setDone(map);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reloadHabits();
        const loadedNotes = await fetchNotes();
        if (!cancelled) setNotes(loadedNotes);
      } catch (e) {
        if (!cancelled) Alert.alert('Could not load your data', errorText(e));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadHabits]);

  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e) {
      Alert.alert('Something went wrong', errorText(e));
    }
  }, []);

  const toggle = useCallback(
    (habitId: string, date: string) =>
      run(async () => {
        const wasDone = done[habitId]?.has(date) ?? false;
        await setCompletion(userId, habitId, date, !wasDone);
        setDone(prev => {
          const set = new Set(prev[habitId] ?? []);
          if (wasDone) set.delete(date);
          else set.add(date);
          return { ...prev, [habitId]: set };
        });
      }),
    [userId, done, run],
  );

  const saveHabit = useCallback(
    (input: HabitInput) =>
      run(async () => {
        const name = input.name.trim();
        const note = input.note.trim();
        if (input.id === undefined) {
          await insertHabit(userId, name, note, habits.length, toDateKey());
        } else {
          await updateHabit(input.id, { name, note, archived: input.archived });
        }
        await reloadHabits();
      }),
    [userId, habits.length, run, reloadHabits],
  );

  const deleteHabit = useCallback(
    (id: string) =>
      run(async () => {
        await removeHabit(id);
        await reloadHabits();
      }),
    [run, reloadHabits],
  );

  const saveNote = useCallback(
    (date: string, body: string) =>
      run(async () => {
        await setDayNote(userId, date, body);
        setNotes(prev => {
          const next = { ...prev };
          const trimmed = body.trim();
          if (trimmed === '') delete next[date];
          else next[date] = trimmed;
          return next;
        });
      }),
    [userId, run],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      habits,
      activeHabits: habits.filter(h => !h.archived),
      notes,
      datesFor: (habitId: string) => done[habitId] ?? EMPTY_SET,
      isDone: (habitId: string, date: string) => done[habitId]?.has(date) ?? false,
      toggle,
      saveHabit,
      deleteHabit,
      saveNote,
    }),
    [ready, habits, notes, done, toggle, saveHabit, deleteHabit, saveNote],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useData(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}