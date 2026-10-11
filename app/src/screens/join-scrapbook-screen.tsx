import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CODE_LENGTH, CodeInput } from '@/components/scrapbook/code-input';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { useData } from '@/lib/data';
import { joinScrapbook } from '@/lib/scrapbook-api';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

function joinErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return 'No scrapbook has that code. Check it with your friend and try again.';
    if (err.status === 0 || err.status === 408) return 'Couldn’t reach noted!. Check your connection and try again.';
    return err.message;
  }
  return 'Couldn’t join that scrapbook. Please try again.';
}

/** Enter a friend's 6-character code to join their scrapbook and add your photos. */
export function JoinScrapbookScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const online = Boolean(session && API_URL);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(`Codes are ${CODE_LENGTH} letters and numbers.`);
      return;
    }
    setError(null);
    setJoining(true);
    try {
      const token = await getAccessToken();
      const joined = await joinScrapbook({ token, profile }, code);
      await refresh();
      router.replace({ pathname: '/scrapbook/[id]', params: { id: joined.id, joined: '1' } });
    } catch (err) {
      setError(joinErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Join a scrapbook" backIcon="close" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.icon}>
          <Ionicons name="key-outline" size={28} color={Colors.navy} />
        </View>
        <AppText variant="title" style={styles.center}>
          Enter your code
        </AppText>
        <AppText variant="body" color={Colors.textMuted} style={styles.center}>
          Ask the friend who made the scrapbook for its 6-character code. You’ll be able to add your own photos and captions.
        </AppText>

        {online ? (
          <>
            <CodeInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) setError(null);
              }}
              onSubmit={join}
              invalid={Boolean(error)}
            />
            {error ? (
              <AppText variant="caption" color={Colors.danger} accessibilityRole="alert" style={styles.center}>
                {error}
              </AppText>
            ) : null}
            <Button label="Join scrapbook" icon="enter-outline" onPress={join} loading={joining} disabled={code.length !== CODE_LENGTH} />
          </>
        ) : (
          <Notice icon="person-circle-outline" tone="slate" message="Sign in to join a friend’s scrapbook. Codes are checked with the noted! server." />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Gutter, paddingTop: Spacing.xl, gap: Spacing.lg, alignItems: 'stretch' },
  icon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
