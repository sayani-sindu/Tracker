import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Habit } from '../db';
import { useData } from '../store';
import { HabitForm } from './HabitForm';
import { colors, spacing } from '../theme';

type Props = {
  onSignOut: () => void;
};

export function HabitsScreen({ onSignOut }: Props) {
  const { habits } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const active = habits.filter(h => !h.archived);
  const archived = habits.filter(h => h.archived);

  function openForm(habit: Habit | null) {
    setEditing(habit);
    setFormOpen(true);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Habits</Text>

      <Pressable onPress={() => openForm(null)} style={styles.addButton} accessibilityRole="button">
        <Text style={styles.addText}>+ New habit</Text>
      </Pressable>

      <Text style={styles.label}>Active · {active.length}</Text>
      {active.length === 0 ? (
        <Text style={styles.empty}>No active habits. Tap “New habit” to add one.</Text>
      ) : null}
      {active.map(habit => (
        <HabitItem key={habit.id} habit={habit} onPress={() => openForm(habit)} />
      ))}

      {archived.length > 0 ? (
        <>
          <Text style={styles.label}>Archived · {archived.length}</Text>
          {archived.map(habit => (
            <HabitItem key={habit.id} habit={habit} onPress={() => openForm(habit)} />
          ))}
        </>
      ) : null}

      <Pressable onPress={onSignOut} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <HabitForm visible={formOpen} habit={editing} onClose={() => setFormOpen(false)} />
    </ScrollView>
  );
}

function HabitItem({ habit, onPress }: { habit: Habit; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Text style={[styles.itemName, habit.archived && styles.itemMuted]}>{habit.name}</Text>
      {habit.note ? (
        <Text style={styles.itemNote} numberOfLines={2}>
          {habit.note}
        </Text>
      ) : null}
    </Pressable>
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
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  empty: {
    color: colors.secondary,
    fontSize: 15,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
  },
  itemMuted: {
    color: colors.muted,
  },
  signOut: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 16,
    color: colors.danger,
  },
  itemNote: {
    marginTop: 3,
    fontSize: 13,
    color: colors.secondary,
  },
});