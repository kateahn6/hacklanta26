import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { expiryLabel, isOwn } from '@/lib/visibility';
import type { Postcard, Scrapbook } from '@/types';

interface StatusBadgesProps {
  item: Postcard | Scrapbook;
  now: number;
}

/** Owner-only status: draft, private, and postcard expiry. Nothing renders for other people's content. */
export function StatusBadges({ item, now }: StatusBadgesProps) {
  if (!isOwn(item)) return null;
  const expiresAt = 'expiresAt' in item ? item.expiresAt : null;
  return (
    <View style={styles.row}>
      {item.status === 'draft' ? <Badge label="Draft" icon="create-outline" tone="slate" /> : null}
      {item.visibility === 'private' ? <Badge label="Private" icon="lock-closed" tone="dark" /> : null}
      {item.status === 'published' && expiresAt ? (
        <Badge label={expiryLabel(expiresAt, now)} icon="time-outline" tone="navy" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
