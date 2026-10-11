import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { ScrapbookTile } from '@/components/feed/scrapbook-tile';
import { buildMyPosts, MyPostTile } from '@/components/feed/my-post-tile';
import { SectionHeader } from '@/components/feed/section-header';
import { AppText } from '@/components/ui/app-text';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
import { DEMO_USER_ID } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
import { useApiContent } from '@/lib/api-content';
import { buildPublicFeed, filterFeed, type PostcardItem, type ScrapbookItem } from '@/lib/feed';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId } from '@/types';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const content = useContent();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);

  // The "friends keep coming back" ranking, straight from GET /api/returning.
  const { returningByPlace } = useApiContent();
  const returning = [...returningByPlace.values()]
    .filter((r) => r.return_days > 0)
    .sort((a, b) => b.return_days - a.return_days)
    .slice(0, 3);

  const filtering = query.trim().length > 0 || category !== null;
  const results = filterFeed(buildPublicFeed(content, now), category, query);
  const myPosts = buildMyPosts(content, DEMO_USER_ID);
  const tileWidth = Math.min(150, width * 0.38);
  const scrapbooks = results.filter((item): item is ScrapbookItem => item.kind === 'scrapbook');
  const postcards = results.filter((item): item is PostcardItem => item.kind === 'postcard');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <AppText variant="display">Discover</AppText>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search scrapbooks, places, people" />
      </View>
      {returning.length > 0 && !filtering ? (
        <View style={styles.returning}>
          <SectionHeader title="They keep going back" detail="No likes, no ratings" />
          {returning.map((place, i) => (
            <PressableScale
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`${place.name}, ${place.return_days} return days`}
              onPress={() => router.push('/map')}
              style={styles.returnRow}>
              <AppText variant="heading" color={Colors.slate} style={styles.rank}>
                {i + 1}
              </AppText>
              <View style={styles.returnCopy}>
                <AppText variant="label" numberOfLines={1}>
                  {place.name}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {place.return_days} return {place.return_days === 1 ? 'day' : 'days'} ·{' '}
                  {place.who.join(', ')}
                </AppText>
              </View>
              <Ionicons name="repeat" size={18} color={Colors.slate} />
            </PressableScale>
          ))}
        </View>
      ) : null}

      <View style={styles.chips}>
        <CategoryChips value={category} onChange={setCategory} />
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="No matches"
          message="Try a different search or category to find more of the city."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setCategory(null);
          }}
        />
      ) : null}

      {!filtering ? (
        <View style={styles.section}>
          <SectionHeader title="Your posts" detail={myPosts.length > 0 ? `${myPosts.length} posts` : undefined} />
          {myPosts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {myPosts.map((post) => (
                <MyPostTile key={post.key} post={post} width={tileWidth} now={now} />
              ))}
            </ScrollView>
          ) : (
            <AppText variant="caption" style={styles.noPosts}>
              You haven’t posted yet. Tap Create to share a place.
            </AppText>
          )}
        </View>
      ) : null}

      {scrapbooks.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Scrapbooks" detail={`${scrapbooks.length} themes`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {scrapbooks.map((item) => (
              <ScrapbookTile key={item.key} item={item} width={Math.min(240, width * 0.62)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {postcards.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Postcards" detail={`${postcards.length} places`} />
          <MasonryFeed items={postcards} now={now} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Gutter, gap: Spacing.md },
  chips: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  returning: { paddingHorizontal: Gutter, gap: Spacing.sm, marginTop: Spacing.lg },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.skySoft,
  },
  rank: { width: 22, textAlign: 'center' },
  returnCopy: { flex: 1 },
  section: { marginBottom: Spacing.xxl },
  noPosts: { paddingHorizontal: Gutter },
  carousel: { gap: Spacing.md, paddingHorizontal: Gutter },
});
