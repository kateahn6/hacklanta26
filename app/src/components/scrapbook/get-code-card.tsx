import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { useData } from '@/lib/data';
import { saveSharedScrapbook } from '@/lib/scrapbook-api';
import { useAppStore } from '@/store/app-store';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import type { Scrapbook } from '@/types';

/**
 * Shown on your own scrapbook when it has no access code yet: it lives only on
 * this device. Uploading it to the server is what creates the code.
 */
export function GetCodeCard({ scrapbook }: { scrapbook: Scrapbook }) {
  const { session, profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const markDeleted = useAppStore((s) => s.markDeleted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const online = Boolean(session && API_URL);
  const isDraft = scrapbook.status === 'draft';

  const getCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const saved = await saveSharedScrapbook({ token, profile }, scrapbook);
      markDeleted(scrapbook.id);
      await refresh();
      router.replace({ pathname: '/scrapbook/[id]', params: { id: saved.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a code.');
    } finally {
      setBusy(false);
    }
  };

  const message = !online
    ? 'Sign in to get a 6-character code friends can use to add their photos.'
    : isDraft
      ? 'This is a draft saved on this device. Post it to get a 6-character code friends can use to add their photos.'
      : 'This scrapbook is saved on this device only. Upload it to get a 6-character code friends can use to add their photos.';

  return (
    <View style={styles.card}>
      <AppText variant="label">Invite friends to add photos</AppText>
      <AppText variant="caption">{message}</AppText>
      {online && !isDraft ? (
        <Button label="Get a share code" icon="key-outline" onPress={getCode} loading={busy} />
      ) : null}
      {error ? (
        <AppText variant="caption" color={Colors.navy}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
});
