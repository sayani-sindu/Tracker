import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useData } from '../store';
import { formatLong, toDateKey } from '../lib/dates';
import { currentStreak } from '../lib/stats';
import { colors, spacing } from '../theme';

type Props = {
  date: string; // the day on screen; today unless opened from Stats
  onBackToToday: () => void;
};

export function TodayScreen({ date, onBackToToday }: Props) {
  const { activeHabits, isDone, toggle, datesFor, notes, saveNote } = useData();
  const today = toDateKey();
  const isToday = date === today;
  const [draft, setDraft] = useState('');

  const doneCount = activeHabits.filter(h => isDone(h.id, date)).length;
  const total = activeHabits.length;

  // Latest values, read when leaving the day so an unsaved note is not lost
  const latest = useRef({ draft, notes });
  latest.current = { draft, notes };

  useEffect(() => {
    setDraft(notes[date] ?? '');
  }, [date, notes]);

  useEffect(() => {
    return () => {
      const { draft: text, notes: saved } = latest.current;
      if ((saved[date] ?? '') !== text.trim()) saveNote(date, text);
    };
  }, [date, saveNote]);

  function saveIfChanged() {
    if ((notes[date] ?? '') !== draft.trim()) saveNote(date, draft);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!isToday ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>You are looking at a past day.</Text>
          <Pressable onPress={onBackToToday} hitSlop={8}>
            <Text style={styles.bannerLink}>Back to today</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.title}>{isToday ? 'Today' : 'Past day'}</Text>
      <Text style={styles.subtitle}>{formatLong(date)}</Text>

      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {doneCount} of {total} done
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${total ? (doneCount / total) * 100 : 0}%` }]} />
        </View>
      </View>

      {total === 0 ? (
        <Text style={styles.empty}>No active habits. Add some in the Habits tab.</Text>
      ) : null}

      {activeHabits.map(habit => {
        const done = isDone(habit.id, date);
        const streak = currentStreak(datesFor(habit.id), date);
        return (
          <Pressable
            key={habit.id}
            onPress={() => toggle(habit.id, date)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.habitName, done && styles.habitDone]}>{habit.name}</Text>
              {streak > 0 ? <Text style={styles.streak}>{streak}-day streak</Text> : null}
            </View>
            <View style={[styles.check, done && styles.checkOn]}>
              {done ? <Text style={styles.tick}>✓</Text> : null}
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.label}>Notes for this day</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={saveIfChanged}
        multiline
        placeholder="How did the day go? What got in the way?"
        placeholderTextColor={colors.muted}
        style={styles.note}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  bannerText: {
    fontSize: 14,
    color: colors.secondary,
    flex: 1,
    paddingRight: 8,
  },
  bannerLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 20,
  },
  progress: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 15,
    color: colors.secondary,
    marginBottom: 8,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.empty,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: colors.accent,
  },
  empty: {
    marginTop: 24,
    color: colors.secondary,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
  },
  habitDone: {
    color: colors.secondary,
    textDecorationLine: 'line-through',
  },
  streak: {
    marginTop: 2,
    fontSize: 13,
    color: colors.accent,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tick: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  note: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});