import { supabase } from './lib/supabase';

export type Habit = {
  id: string;
  name: string;
  note: string;
  archived: boolean;
  position: number;
  createdOn: string;
};

type HabitRow = {
  id: string;
  name: string;
  note: string;
  archived: boolean;
  position: number;
  created_on: string;
};

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Reads every row, page by page, so no data is cut off
async function fetchAll<T>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    check(error);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function fetchHabits(): Promise<Habit[]> {
  const rows = await fetchAll<HabitRow>((from, to) =>
    supabase
      .from('habits')
      .select('id, name, note, archived, position, created_on')
      .order('archived', { ascending: true })
      .order('position', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to),
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    note: r.note,
    archived: r.archived,
    position: r.position,
    createdOn: r.created_on,
  }));
}

export async function fetchCompletions(): Promise<{ habitId: string; date: string }[]> {
  const rows = await fetchAll<{ habit_id: string; date: string }>((from, to) =>
    supabase
      .from('completions')
      .select('habit_id, date')
      .order('habit_id', { ascending: true })
      .order('date', { ascending: true })
      .range(from, to),
  );
  return rows.map(r => ({ habitId: r.habit_id, date: r.date }));
}

export async function fetchNotes(): Promise<Record<string, string>> {
  const rows = await fetchAll<{ date: string; body: string }>((from, to) =>
    supabase
      .from('day_notes')
      .select('date, body')
      .order('date', { ascending: true })
      .range(from, to),
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.date] = r.body;
  return out;
}

export async function setCompletion(
  userId: string,
  habitId: string,
  date: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase
      .from('completions')
      .upsert(
        { user_id: userId, habit_id: habitId, date },
        { onConflict: 'habit_id,date', ignoreDuplicates: true },
      );
    check(error);
  } else {
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date);
    check(error);
  }
}

export async function setDayNote(userId: string, date: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (trimmed === '') {
    const { error } = await supabase.from('day_notes').delete().eq('date', date);
    check(error);
  } else {
    const { error } = await supabase
      .from('day_notes')
      .upsert({ user_id: userId, date, body: trimmed }, { onConflict: 'user_id,date' });
    check(error);
  }
}

export async function insertHabit(
  userId: string,
  name: string,
  note: string,
  position: number,
  createdOn: string,
): Promise<void> {
  const { error } = await supabase.from('habits').insert({
    user_id: userId,
    name,
    note,
    position,
    created_on: createdOn,
  });
  check(error);
}

export async function updateHabit(
  id: string,
  fields: { name: string; note: string; archived: boolean },
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ name: fields.name, note: fields.note, archived: fields.archived })
    .eq('id', id);
  check(error);
}

// Completions for this habit are removed automatically by the database
export async function removeHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  check(error);
}