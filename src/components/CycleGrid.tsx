import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type CycleCell = {
  day: number;
  count: number;
  isToday: boolean;
  isFuture: boolean;
};

type Props = {
  cells: CycleCell[];
  total: number;
  columns?: number;
};

const CELL_SIZE = 40;

export function CycleGrid({ cells, total, columns = 7 }: Props) {
  // Split into rows so the layout stays predictable on any iPhone width
  const rows: CycleCell[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map(cell => (
            <Cell key={cell.day} cell={cell} total={total} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Cell({ cell, total }: { cell: CycleCell; total: number }) {
  const filled = cell.count > 0;
  const level = filled
    ? Math.min(colors.gridLevels.length - 1, Math.ceil((cell.count / total) * colors.gridLevels.length) - 1)
    : -1;

  const background = filled ? colors.gridLevels[level] : colors.empty;
  const textColor = level >= 3 ? '#FFFFFF' : colors.ink;

  return (
    <View
      accessibilityLabel={`Day ${cell.day}, ${cell.count} of ${total} done`}
      style={[
        styles.cell,
        { backgroundColor: background },
        cell.isToday && styles.today,
        cell.isFuture && styles.future,
      ]}
    >
      <Text style={[styles.num, { color: textColor }, cell.isFuture && styles.futureText]}>
        {cell.day}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  future: {
    opacity: 0.5,
  },
  futureText: {
    color: colors.secondary,
  },
  num: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});