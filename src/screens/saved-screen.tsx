import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useNow } from '@/hooks/use-now';
import { type FeedItem, toPostcardItem, toScrapbookItem } from '@/lib/feed';
import { canViewPostcard, canViewScrapbook } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

type Filter = 'all' | 'postcard' | 'scrapbook';

export function SavedScreen() {
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const saved = useAppStore((s) => s.saved);
  const [filter, setFilter] = useState<Filter>('all');

  // Saved items that expired or went private are hidden rather than shown broken.
  const items = saved.flatMap<FeedItem>((key) => {
    const [kind, id] = key.split(':');
    if (kind === 'postcard') {
      const postcard = content.postcardById.get(id);
      return postcard && canViewPostcard(postcard, now) ? (toPostcardItem(content, postcard) ?? []) : [];
    }
    const scrapbook = content.scrapbookById.get(id);
    return scrapbook && canViewScrapbook(scrapbook) ? [toScrapbookItem(content, scrapbook, now)] : [];
  });
  const visible = items.filter((item) => filter === 'all' || item.kind === filter);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.xxxl }}>
      <View style={styles.header}>
        <AppText variant="overline">Your collection</AppText>
        <AppText variant="display">Saved</AppText>
        <AppText variant="body" color={Colors.muted}>
          {items.length === 0 ? 'Places you want to try, all in one spot.' : `${items.length} things you want to try.`}
        </AppText>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'postcard', label: 'Postcards' },
            { value: 'scrapbook', label: 'Scrapbooks' },
          ]}
        />
      </View>

      {visible.length > 0 ? (
        <MasonryFeed items={visible} now={now} />
      ) : (
        <EmptyState
          icon="bookmark-outline"
          title={items.length === 0 ? 'Nothing saved yet' : `No saved ${filter === 'postcard' ? 'postcards' : 'scrapbooks'}`}
          message="Tap the bookmark on any postcard or scrapbook to keep it here for later."
          actionLabel="Start exploring"
          onAction={() => router.navigate('/')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: Gutter, gap: Spacing.sm, marginBottom: Spacing.xl },
});
