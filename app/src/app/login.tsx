import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { API_URL, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } from '@/lib/config';

/** Named so a blank screen is never a mystery: the app says what is missing. */
const MISSING = (
  [
    ['EXPO_PUBLIC_AUTH0_DOMAIN', AUTH0_DOMAIN],
    ['EXPO_PUBLIC_AUTH0_CLIENT_ID', AUTH0_CLIENT_ID],
    ['EXPO_PUBLIC_AUTH0_AUDIENCE', AUTH0_AUDIENCE],
    ['EXPO_PUBLIC_API_URL', API_URL],
  ] as const
)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export default function LoginScreen() {
  const { session, ready, busy, error, signIn, redirectUri } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Printed on every launch: in Expo Go this changes with the dev server host.
    console.log('[unfold] Auth0 redirect URI (add to Allowed Callback URLs):', redirectUri);
    console.log('[unfold] API URL:', API_URL || '(not set)');
  }, [redirectUri]);

  useEffect(() => {
    if (ready && session) router.replace('/');
  }, [ready, session]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>Unfold</Text>
          <Text style={styles.tagline}>
            The places your friends keep going back to — in their own words, with their own
            photos. No stars, no scores.
          </Text>
        </View>

        {MISSING.length > 0 ? (
          <Banner text={`Not configured: ${MISSING.join(', ')}. Copy app/.env.example to app/.env, fill it in, then restart with: npx expo start -c`} />
        ) : null}
        {error ? <Banner text={error} /> : null}

        <Button
          label="Continue with Google"
          onPress={signIn}
          busy={busy || !ready}
        />

        <View style={styles.setup}>
          <Text style={styles.setupTitle}>Auth0 setup</Text>
          <Text style={styles.setupBody}>
            Add this exact URL to Allowed Callback URLs (and Allowed Logout URLs) on your Auth0
            native application:
          </Text>
          <Text selectable style={styles.uri}>
            {redirectUri}
          </Text>
          <Button
            variant="secondary"
            label={copied ? 'Copied' : 'Copy redirect URI'}
            onPress={async () => {
              await Clipboard.setStringAsync(redirectUri);
              setCopied(true);
            }}
          />
          <Text style={styles.setupFoot}>
            It is also printed in the Expo terminal on every launch. In Expo Go it changes with
            your dev server host, so re-copy it if you switch networks.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.paper },
  container: { padding: Spacing.lg, gap: Spacing.lg, flexGrow: 1, justifyContent: 'center' },
  hero: { gap: Spacing.sm },
  wordmark: { fontSize: 44, fontWeight: '800', color: Colors.ink, letterSpacing: -1 },
  tagline: { fontSize: 16, lineHeight: 23, color: Colors.inkSoft },
  setup: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  setupTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  setupBody: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft },
  uri: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: Colors.ink,
    backgroundColor: Colors.paper,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  setupFoot: { fontSize: 12, lineHeight: 17, color: Colors.inkSoft },
});
