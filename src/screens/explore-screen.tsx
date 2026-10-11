import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { FeaturedCard } from '@/components/feed/featured-card';
import { SectionHeader } from '@/components/feed/section-header';
import { ShortcutCard } from '@/components/feed/shortcut-card';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
import { DEMO_USER_ID } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
import { buildPublicFeed, filterFeed, type ScrapbookItem } from '@/lib/feed';
import { useContent } from '@/store/content';
import { Colors, Fonts, Gutter, Spacing } from '@/theme/tokens';
import type { CategoryId } from '@/types';

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);

  const me = content.userById.get(DEMO_USER_ID);
  const feed = buildPublicFeed(content, now);
  const featured = feed.find((item): item is ScrapbookItem => item.kind === 'scrapbook' && item.scrapbook.featured === true);
  const filtering = query.trim().length > 0 || category !== null;
  const results = filterFeed(
    feed.filter((item) => filtering || item !== featured),
    category,
    query,
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <AppText style={styles.wordmark} accessibilityRole="header">
            Noted!
          </AppText>
          {me ? (
            <PressableScale accessibilityRole="button" accessibilityLabel="Your profile" hitSlop={8} onPress={() => router.push('/profile')}>
              <Avatar user={me} size={38} />
            </PressableScale>
          ) : null}
        </View>
        <AppText variant="display">Find your next thing.</AppText>
        <AppText variant="body" color={Colors.muted}>
          Real places, recommended by people around Atlanta.
        </AppText>
        <SearchBar value={query} onChangeText={setQuery} />
        <View style={styles.shortcuts}>
          <ShortcutCard
            icon="map-outline"
            title="Explore map"
            detail="See where everything is"
            tone="sage"
            onPress={() => router.push('/map')}
          />
          <ShortcutCard
            icon="sparkles-outline"
            title="Ask Noted!"
            detail="Get picks for your plans"
            tone="cherry"
            onPress={() => router.push('/ask')}
          />
        </View>
      </View>

      {featured && !filtering ? (
        <View style={styles.featured}>
          <FeaturedCard item={featured} />
        </View>
      ) : null}

      <View style={styles.chips}>
        <CategoryChips value={category} onChange={setCategory} />
      </View>

      <SectionHeader
        title={filtering ? 'Results' : 'From the community'}
        detail={`${results.length} ${results.length === 1 ? 'find' : 'finds'}`}
      />
      {results.length > 0 ? (
        <MasonryFeed items={results} now={now} />
      ) : (
        <EmptyState
          icon="search-outline"
          title="Nothing here yet"
          message="No postcards or scrapbooks match that. Try another word or category."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setCategory(null);
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: Gutter, gap: Spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: Fonts.serif, fontSize: 26, color: Colors.cherry },
  shortcuts: { flexDirection: 'row', gap: Spacing.sm },
  featured: { paddingHorizontal: Gutter, marginTop: Spacing.xl },
  chips: { marginTop: Spacing.xl, marginBottom: Spacing.lg },
});
