import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataProvider, useData } from './src/store';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsScreen } from './src/screens/HabitScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { toDateKey } from './src/lib/dates';
import { colors } from './src/theme';

type Tab = 'today' | 'habits' | 'stats';

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'habits', label: 'Habits' },
  { key: 'stats', label: 'Stats' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { ready } = useData();
  const [tab, setTab] = useState<Tab>('today');
  // null means "today". A value is set only when a past day is opened from Stats.
  const [viewDate, setViewDate] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const today = toDateKey();

  function selectTab(next: Tab) {
    setTab(next);
    if (next === 'today') setViewDate(null);
  }

  function openDate(date: string) {
    setViewDate(date === today ? null : date);
    setTab('today');
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        {tab === 'today' ? (
          <TodayScreen date={viewDate ?? today} onBackToToday={() => setViewDate(null)} />
        ) : null}
        {tab === 'habits' ? <HabitsScreen /> : null}
        {tab === 'stats' ? <StatsScreen onOpenDate={openDate} /> : null}
      </View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 6 }]}>
        {TABS.map(item => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => selectTab(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.tab}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
});