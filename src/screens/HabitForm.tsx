import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Habit } from '../db';
import { useData } from '../store';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  habit: Habit | null; // null means "new habit"
  onClose: () => void;
};

export function HabitForm({ visible, habit, onClose }: Props) {
  const { saveHabit, deleteHabit } = useData();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState('');

  // Reset the fields every time the sheet opens
  useEffect(() => {
    if (visible) {
      setName(habit?.name ?? '');
      setNote(habit?.note ?? '');
      setArchived(habit?.archived ?? false);
      setError('');
    }
  }, [visible, habit]);

  async function save() {
    if (!name.trim()) {
      setError('Give the habit a name.');
      return;
    }
    await saveHabit({ id: habit?.id, name, note, archived });
    onClose();
  }

  function confirmDelete() {
    if (!habit) return;
    Alert.alert(
      'Delete this habit?',
      'Its history will be removed too. Archive it instead if you want to keep the history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
          <Pressable onPress={save} hitSlop={12}>
            <Text style={styles.linkBold}>Save</Text>
          </Pressable>
        </View>

        <Text style={styles.heading}>{habit ? 'Edit habit' : 'New habit'}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={text => {
            setName(text);
            setError('');
          }}
          placeholder="e.g. Drink 2 litres of water"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Why it matters (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Your reason, so you remember it on a bad day"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.multiline]}
        />

        {habit ? (
          <View style={styles.actions}>
            <Pressable onPress={() => setArchived(a => !a)} style={styles.actionRow}>
              <Text style={styles.actionText}>{archived ? 'Restore habit' : 'Archive habit'}</Text>
            </Pressable>
            <Pressable onPress={confirmDelete} style={styles.actionRow}>
              <Text style={styles.danger}>Delete habit</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  link: {
    fontSize: 17,
    color: colors.secondary,
  },
  linkBold: {
    fontSize: 17,
    color: colors.accent,
    fontWeight: '600',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 14,
  },
  actions: {
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  actionRow: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  actionText: {
    fontSize: 17,
    color: colors.accent,
  },
  danger: {
    fontSize: 17,
    color: colors.danger,
  },
});