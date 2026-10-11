import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Banner } from '@/components/ui';
import { s } from '@/constants/styles';
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
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.page, { flexGrow: 1, justifyContent: 'center' }]}>
        <Text style={s.eyebrow}>ATLANTA, GEORGIA</Text>
        <Text style={s.logo}>
          unfold<Text style={s.logoBang}>!</Text>
        </Text>
        <Text style={s.heroTitle}>Real places, real people.</Text>
        <Text style={s.heroCopy}>
          The places your friends keep going back to — in their own words, with their own photos.
          No stars, no scores.
        </Text>

        {MISSING.length > 0 ? (
          <Banner
            text={`Not configured: ${MISSING.join(
              ', '
            )}. Copy app/.env.example to app/.env, fill it in, then restart with: npx expo start -c`}
          />
        ) : null}
        {error ? <Banner text={error} /> : null}

        <View style={{ height: 16 }} />
        <ActionButton label="Continue with Google" onPress={signIn} busy={busy || !ready} />

        <View style={[s.infoBox, { marginTop: 24 }]}>
          <Text style={s.sectionTitle}>Auth0 setup</Text>
          <Text style={s.cardMeta}>
            Add this exact URL to Allowed Callback URLs on your Auth0 native application:
          </Text>
          <Text selectable style={s.mono}>
            {redirectUri}
          </Text>
          <ActionButton
            secondary
            label={copied ? 'Copied' : 'Copy redirect URI'}
            onPress={async () => {
              await Clipboard.setStringAsync(redirectUri);
              setCopied(true);
            }}
          />
          <Text style={s.smallNote}>
            Also printed in the Expo terminal on every launch. In Expo Go it changes with your dev
            server host, so re-copy it after switching networks or starting a tunnel.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
