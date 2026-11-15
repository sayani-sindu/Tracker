import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import { DataProvider } from './src/store';
import { AuthScreen } from './src/screens/AuthScreen';
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
      <Root />
    </SafeAreaProvider>
  );
}

// Decides what to show: a loading spinner, the login screen, or the app for the signed-in user
function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <AuthScreen />
      </SafeAreaView>
    );
  }

  // Keying on the user id makes sure one user's data never shows for another
  return (
    <DataProvider key={session.user.id} userId={session.user.id}>
      <Shell onSignOut={() => supabase.auth.signOut()} />
    </DataProvider>
  );
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        {tab === 'today' ? (
          <TodayScreen date={viewDate ?? today} onBackToToday={() => setViewDate(null)} />
        ) : null}
        {tab === 'habits' ? <HabitsScreen onSignOut={onSignOut} /> : null}
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