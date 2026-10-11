import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { CollectionTile } from '@/components/feed/collection-tile';
import { FeaturedCard } from '@/components/feed/featured-card';
import { SectionHeader } from '@/components/feed/section-header';
import { AppText } from '@/components/ui/app-text';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
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
  const featured = filtering
    ? undefined
    : results.find((item): item is ScrapbookItem => item.kind === 'scrapbook' && item.scrapbook.featured === true);
  const collections = results.filter((item): item is ScrapbookItem => item.kind === 'scrapbook' && item !== featured);
  const postcards = results.filter((item): item is PostcardItem => item.kind === 'postcard');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText variant="overline">Public from the community</AppText>
            <AppText variant="display">Discover</AppText>
          </View>
          <IconButton icon="map-outline" label="Open map" onPress={() => router.push('/map')} />
        </View>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search collections, places, people" />
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
              <AppText variant="heading" color={Colors.olive} style={styles.rank}>
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
              <Ionicons name="repeat" size={18} color={Colors.olive} />
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

      {featured ? (
        <View style={styles.featured}>
          <FeaturedCard item={featured} />
        </View>
      ) : null}

      {collections.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Themed collections" detail={`${collections.length} scrapbooks`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {collections.map((item) => (
              <CollectionTile key={item.key} item={item} width={Math.min(240, width * 0.62)} />
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
  screen: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: Gutter, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  titleText: { gap: 2 },
  chips: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  returning: { paddingHorizontal: Gutter, gap: Spacing.sm, marginTop: Spacing.lg },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.sageSoft,
  },
  rank: { width: 22, textAlign: 'center' },
  returnCopy: { flex: 1 },
  section: { marginBottom: Spacing.xxl },
  featured: { paddingHorizontal: Gutter, marginBottom: Spacing.xxl },
  carousel: { gap: Spacing.md, paddingHorizontal: Gutter },
});
