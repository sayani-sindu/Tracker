import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../theme';

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setMessage('');
    if (!email.trim() || password.length < 6) {
      setMessage('Enter your email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signUp') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // If email confirmation is on, there is no session yet
        if (!data.session) {
          setMessage('Check your email and tap the confirmation link, then sign in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setMessage((e as { message?: string })?.message ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const isSignUp = mode === 'signUp';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Tracker</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Create an account to keep your habits safe.' : 'Sign in to see your habits.'}
      </Text>

      <View style={styles.switch}>
        <Pressable onPress={() => setMode('signIn')} style={[styles.switchItem, !isSignUp && styles.switchOn]}>
          <Text style={[styles.switchText, !isSignUp && styles.switchTextOn]}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => setMode('signUp')} style={[styles.switchItem, isSignUp && styles.switchOn]}>
          <Text style={[styles.switchText, isSignUp && styles.switchTextOn]}>Create account</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType={isSignUp ? 'newPassword' : 'password'}
        placeholder="At least 6 characters"
        placeholderTextColor={colors.muted}
        style={styles.input}
        onSubmitEditing={submit}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy}
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonBusy]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 24,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.empty,
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  switchItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  switchOn: {
    backgroundColor: colors.surface,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.secondary,
  },
  switchTextOn: {
    color: colors.ink,
    fontWeight: '600',
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
  message: {
    marginTop: 14,
    fontSize: 14,
    color: colors.danger,
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonBusy: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});