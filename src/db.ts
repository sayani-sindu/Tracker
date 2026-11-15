import * as SQLite from 'expo-sqlite';
import { toDateKey } from './lib/dates';

export type DB = SQLite.SQLiteDatabase;

export type Habit = {
  id: number;
  name: string;
  note: string;
  archived: boolean;
  position: number;
  createdOn: string;
};

type HabitRow = {
  id: number;
  name: string;
  note: string;
  archived: number;
  position: number;
  created_on: string;
};

const DEFAULT_HABITS = [
  'Wake up by 7 AM',
  'No morning Instagram',
  'Complete gym session',
  'Complete priority work',
  'Avoid unnecessary overtime',
  'Learning / career growth',
  'Read for 10 minutes',
  'Sleep by 11 PM',
];

export async function openDatabase(): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('tracker.db');

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      note       TEXT    NOT NULL DEFAULT '',
      archived   INTEGER NOT NULL DEFAULT 0,
      position   INTEGER NOT NULL DEFAULT 0,
      created_on TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completions (
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date     TEXT    NOT NULL,
      PRIMARY KEY (habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS day_notes (
      date TEXT PRIMARY KEY,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed the starting habits once, on first launch only
  const seeded = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'seeded'`,
  );
  if (!seeded) {
    const today = toDateKey();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < DEFAULT_HABITS.length; i++) {
        await db.runAsync(
          `INSERT INTO habits (name, position, created_on) VALUES (?, ?, ?)`,
          [DEFAULT_HABITS[i], i, today],
        );
      }
      await db.runAsync(`INSERT INTO settings (key, value) VALUES ('seeded', '1')`);
    });
  }

  return db;
}

export async function fetchHabits(db: DB): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT id, name, note, archived, position, created_on
       FROM habits
      ORDER BY archived ASC, position ASC, id ASC`,
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    note: r.note,
    archived: r.archived === 1,
    position: r.position,
    createdOn: r.created_on,
  }));
}

export async function fetchCompletions(db: DB): Promise<{ habitId: number; date: string }[]> {
  const rows = await db.getAllAsync<{ habit_id: number; date: string }>(
    `SELECT habit_id, date FROM completions`,
  );
  return rows.map(r => ({ habitId: r.habit_id, date: r.date }));
}

export async function fetchNotes(db: DB): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ date: string; body: string }>(
    `SELECT date, body FROM day_notes`,
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.date] = r.body;
  return out;
}

export async function setCompletion(
  db: DB,
  habitId: number,
  date: string,
  done: boolean,
): Promise<void> {
  if (done) {
    await db.runAsync(
      `INSERT OR IGNORE INTO completions (habit_id, date) VALUES (?, ?)`,
      [habitId, date],
    );
  } else {
    await db.runAsync(
      `DELETE FROM completions WHERE habit_id = ? AND date = ?`,
      [habitId, date],
    );
  }
}

export async function setDayNote(db: DB, date: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (trimmed === '') {
    await db.runAsync(`DELETE FROM day_notes WHERE date = ?`, [date]);
  } else {
    await db.runAsync(
      `INSERT INTO day_notes (date, body) VALUES (?, ?)
       ON CONFLICT(date) DO UPDATE SET body = excluded.body`,
      [date, trimmed],
    );
  }
}

export async function insertHabit(db: DB, name: string, note: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO habits (name, note, position, created_on)
     VALUES (?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM habits), ?)`,
    [name, note, toDateKey()],
  );
}

export async function updateHabit(
  db: DB,
  id: number,
  fields: { name: string; note: string; archived: boolean },
): Promise<void> {
  await db.runAsync(
    `UPDATE habits SET name = ?, note = ?, archived = ? WHERE id = ?`,
    [fields.name, fields.note, fields.archived ? 1 : 0, id],
  );
}

// Deleting a habit also removes its completions (ON DELETE CASCADE)
export async function removeHabit(db: DB, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
}