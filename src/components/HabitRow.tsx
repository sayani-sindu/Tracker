import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  title: string;
  hint: string;
  done: boolean;
  onToggle: () => void;
};

export function HabitRow({ title, hint, done, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      <View style={[styles.check, done && styles.checkDone]}>
        {done ? <Text style={styles.tick}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.row,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
  },
  titleDone: {
    color: colors.secondary,
    textDecorationLine: 'line-through',
  },
  hint: {
    marginTop: 2,
    fontSize: 13,
    color: colors.secondary,
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
  checkDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tick: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});