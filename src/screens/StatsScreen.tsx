import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useData } from '../store';
import { toDateKey } from '../lib/dates';
import { bestStreak, chunk, completionRate, currentStreak } from '../lib/stats';
import { colors, spacing } from '../theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday first, to match the calendar

type Props = {
  onOpenDate: (date: string) => void;
};

export function StatsScreen({ onOpenDate }: Props) {
  const { activeHabits, datesFor, isDone } = useData();
  const today = toDateKey();
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), index: now.getMonth() });

  // Build the calendar grid for the shown month, with blanks before day 1
  const firstDay = new Date(month.year, month.index, 1);
  const daysInMonth = new Date(month.year, month.index + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toDateKey(new Date(month.year, month.index, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = chunk(cells, 7);

  const canGoNext =
    month.year < now.getFullYear() ||
    (month.year === now.getFullYear() && month.index < now.getMonth());

  function shiftMonth(n: number) {
    const d = new Date(month.year, month.index + n, 1);
    setMonth({ year: d.getFullYear(), index: d.getMonth() });
  }

  const shareDone = (date: string) =>
    activeHabits.length === 0
      ? 0
      : activeHabits.filter(h => isDone(h.id, date)).length / activeHabits.length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stats</Text>

      <Text style={styles.label}>Calendar</Text>
      <View style={styles.monthBar}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[month.index]} {month.year}
        </Text>
        <Pressable onPress={() => shiftMonth(1)} disabled={!canGoNext} hitSlop={12}>
          <Text style={[styles.nav, !canGoNext && styles.navOff]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, r) => (
        <View key={r} style={styles.weekRow}>
          {week.map((date, c) => {
            if (!date) return <View key={c} style={styles.dayCell} />;
            const isFuture = date > today;
            const share = shareDone(date);
            const level = share === 0 ? -1 : Math.min(4, Math.ceil(share * 5) - 1);
            const background =
              level < 0 ? colors.empty : colors.gridLevels[level];
            const textColor = isFuture ? colors.muted : level >= 3 ? '#FFFFFF' : colors.ink;
            return (
              <Pressable
                key={date}
                disabled={isFuture}
                onPress={() => onOpenDate(date)}
                accessibilityLabel={`${date}, ${Math.round(share * 100)} percent done`}
                style={({ pressed }) => [styles.dayCell, pressed && styles.pressed]}
              >
                <View
                  style={[
                    styles.dayInner,
                    { backgroundColor: isFuture ? 'transparent' : background },
                    date === today && styles.todayRing,
                  ]}
                >
                  <Text style={[styles.dayNum, { color: textColor }]}>{Number(date.slice(8))}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={styles.hint}>Tap a day to see what you did on it.</Text>

      <Text style={styles.label}>Per habit</Text>
      {activeHabits.length === 0 ? (
        <Text style={styles.empty}>Add a habit to see its stats.</Text>
      ) : null}

      {activeHabits.map(habit => {
        const done = datesFor(habit.id);
        const current = currentStreak(done, today);
        const best = bestStreak(Array.from(done));
        const pct = Math.round(completionRate(done, habit.createdOn, today, 30) * 100);

        return (
          <View key={habit.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{habit.name}</Text>
              <View style={[styles.pill, current === 0 && styles.pillOff]}>
                <Text style={[styles.pillText, current === 0 && styles.pillTextOff]}>
                  {current > 0 ? `${current}-day streak` : 'No streak'}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <Stat value={`${best}`} label="Best streak" />
              <Stat value={`${pct}%`} label="Last 30 days" />
              <Stat value={`${done.size}`} label="Days done" />
            </View>

          </View>
        );
      })}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  label: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  nav: {
    fontSize: 28,
    color: colors.accent,
    paddingHorizontal: 8,
  },
  navOff: {
    color: colors.muted,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 3,
  },
  dayInner: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.6,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.secondary,
  },
  empty: {
    color: colors.secondary,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    paddingRight: 10,
  },
  pill: {
    backgroundColor: colors.gridLevels[1],
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillOff: {
    backgroundColor: colors.empty,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gridLevels[4],
  },
  pillTextOff: {
    color: colors.secondary,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.secondary,
  },
  miniWrap: {
    gap: 4,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 4,
  },
  mini: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },
});