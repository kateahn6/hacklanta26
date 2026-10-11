import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { useAuth } from '@/lib/auth';
import { API_URL, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } from '@/lib/config';
import { Colors, Fonts, Gutter, Radius, Spacing } from '@/theme/tokens';

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
    console.log('[noted] Auth0 redirect URI (add to Allowed Callback URLs):', redirectUri);
    console.log('[noted] API URL:', API_URL || '(not set)');
  }, [redirectUri]);

  useEffect(() => {
    if (ready && session) router.replace('/');
  }, [ready, session]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <AppText variant="overline">Atlanta, Georgia</AppText>
        <AppText style={styles.wordmark}>
          noted<AppText style={styles.bang}>!</AppText>
        </AppText>
        <AppText variant="display" style={styles.headline}>
          Real places, real people.
        </AppText>
        <AppText variant="body" color={Colors.textMuted} style={styles.copy}>
          The places your friends keep going back to — in their own words, with their own photos.
          No stars, no scores.
        </AppText>

        {MISSING.length > 0 ? (
          <View style={styles.stack}>
            <Notice
              icon="alert-circle-outline"
              tone="navy"
              message={`Not configured: ${MISSING.join(
                ', '
              )}. Copy app/.env.example to app/.env, fill it in, then restart with: npx expo start -c`}
            />
          </View>
        ) : null}

        {error ? (
          <View style={styles.stack}>
            <Notice icon="warning-outline" tone="navy" message={error} />
          </View>
        ) : null}

        <View style={styles.stack}>
          <Button
            label="Continue with Google"
            icon="logo-google"
            onPress={signIn}
            loading={busy || !ready}
          />
        </View>

        <View style={styles.setup}>
          <AppText variant="heading">Auth0 setup</AppText>
          <AppText variant="caption">
            Add this exact URL to Allowed Callback URLs on your Auth0 native application.
          </AppText>
          <AppText selectable style={styles.mono}>
            {redirectUri}
          </AppText>
          <Button
            label={copied ? 'Copied' : 'Copy redirect URI'}
            variant="secondary"
            icon="copy-outline"
            onPress={async () => {
              await Clipboard.setStringAsync(redirectUri);
              setCopied(true);
            }}
          />
          <AppText variant="caption">
            Also printed in the Expo terminal on every launch. In Expo Go it changes with your dev
            server host, so re-copy it after switching networks or starting a tunnel.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  page: { paddingHorizontal: Gutter, paddingVertical: Spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  wordmark: { fontFamily: Fonts.script, fontSize: 44, lineHeight: 50, color: Colors.navy },
  bang: { fontFamily: Fonts.script, fontSize: 44, color: Colors.slate },
  headline: { marginTop: Spacing.sm },
  copy: { marginTop: Spacing.md },
  stack: { marginTop: Spacing.lg },
  setup: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.skySoft,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
});
