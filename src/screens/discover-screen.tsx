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
import { SearchBar } from '@/components/ui/search-bar';
import { useNow } from '@/hooks/use-now';
import { buildPublicFeed, filterFeed, type PostcardItem, type ScrapbookItem } from '@/lib/feed';
import { useContent } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';
import type { CategoryId } from '@/types';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const content = useContent();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);

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
  section: { marginBottom: Spacing.xxl },
  featured: { paddingHorizontal: Gutter, marginBottom: Spacing.xxl },
  carousel: { gap: Spacing.md, paddingHorizontal: Gutter },
});
