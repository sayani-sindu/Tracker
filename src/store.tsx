import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  DB,
  Habit,
  fetchCompletions,
  fetchHabits,
  fetchNotes,
  insertHabit,
  openDatabase,
  removeHabit,
  setCompletion,
  setDayNote,
  updateHabit,
} from './db';

type DoneMap = Record<number, Set<string>>;

export type HabitInput = {
  id?: number;
  name: string;
  note: string;
  archived: boolean;
};

type StoreValue = {
  ready: boolean;
  habits: Habit[];
  activeHabits: Habit[];
  notes: Record<string, string>;
  datesFor: (habitId: number) => Set<string>;
  isDone: (habitId: number, date: string) => boolean;
  toggle: (habitId: number, date: string) => Promise<void>;
  saveHabit: (input: HabitInput) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  saveNote: (date: string, body: string) => Promise<void>;
};

const EMPTY_SET = new Set<string>();
const StoreContext = createContext<StoreValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<DoneMap>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reloadHabits = useCallback(async (database: DB) => {
    const [loadedHabits, completions] = await Promise.all([
      fetchHabits(database),
      fetchCompletions(database),
    ]);
    const map: DoneMap = {};
    for (const row of completions) {
      if (!map[row.habitId]) map[row.habitId] = new Set<string>();
      map[row.habitId].add(row.date);
    }
    setHabits(loadedHabits);
    setDone(map);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const database = await openDatabase();
        setDb(database);
        await reloadHabits(database);
        setNotes(await fetchNotes(database));
      } catch (e) {
        Alert.alert('Could not open your data', String(e));
      } finally {
        setReady(true);
      }
    })();
  }, [reloadHabits]);

  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e) {
      Alert.alert('Something went wrong', String(e));
    }
  }, []);

  const toggle = useCallback(
    (habitId: number, date: string) =>
      run(async () => {
        if (!db) return;
        const wasDone = done[habitId]?.has(date) ?? false;
        await setCompletion(db, habitId, date, !wasDone);
        setDone(prev => {
          const set = new Set(prev[habitId] ?? []);
          if (wasDone) set.delete(date);
          else set.add(date);
          return { ...prev, [habitId]: set };
        });
      }),
    [db, done, run],
  );

  const saveHabit = useCallback(
    (input: HabitInput) =>
      run(async () => {
        if (!db) return;
        const name = input.name.trim();
        const note = input.note.trim();
        if (input.id === undefined) {
          await insertHabit(db, name, note);
        } else {
          await updateHabit(db, input.id, { name, note, archived: input.archived });
        }
        await reloadHabits(db);
      }),
    [db, run, reloadHabits],
  );

  const deleteHabit = useCallback(
    (id: number) =>
      run(async () => {
        if (!db) return;
        await removeHabit(db, id);
        await reloadHabits(db);
      }),
    [db, run, reloadHabits],
  );

  const saveNote = useCallback(
    (date: string, body: string) =>
      run(async () => {
        if (!db) return;
        await setDayNote(db, date, body);
        setNotes(prev => {
          const next = { ...prev };
          const trimmed = body.trim();
          if (trimmed === '') delete next[date];
          else next[date] = trimmed;
          return next;
        });
      }),
    [db, run],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      habits,
      activeHabits: habits.filter(h => !h.archived),
      notes,
      datesFor: (habitId: number) => done[habitId] ?? EMPTY_SET,
      isDone: (habitId: number, date: string) => done[habitId]?.has(date) ?? false,
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