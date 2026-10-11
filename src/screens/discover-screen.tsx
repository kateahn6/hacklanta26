import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { CollectionTile } from '@/components/feed/collection-tile';
import { buildMyPosts, MyPostTile } from '@/components/feed/my-post-tile';
import { SectionHeader } from '@/components/feed/section-header';
import { AppText } from '@/components/ui/app-text';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
import { DEMO_USER_ID } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
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

  const filtering = query.trim().length > 0 || category !== null;
  const results = filterFeed(buildPublicFeed(content, now), category, query);
  const myPosts = buildMyPosts(content, now, DEMO_USER_ID);
  const tileWidth = Math.min(150, width * 0.38);
  const collections = results.filter((item): item is ScrapbookItem => item.kind === 'scrapbook');
  const postcards = results.filter((item): item is PostcardItem => item.kind === 'postcard');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <AppText variant="display">Discover</AppText>
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

      {!filtering ? (
        <View style={styles.section}>
          <SectionHeader title="Your posts" detail={myPosts.length > 0 ? `${myPosts.length} posts` : undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {myPosts.map((post) => (
              <MyPostTile key={post.key} post={post} width={tileWidth} now={now} />
            ))}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Create a postcard"
              onPress={() => router.push('/create/postcard')}
              style={[styles.newPost, { width: tileWidth, height: tileWidth / 0.95 }]}>
              <Ionicons name="add" size={26} color={Colors.cherry} />
              <AppText variant="label" color={Colors.cherry}>
                {myPosts.length > 0 ? 'New postcard' : 'Share your first place'}
              </AppText>
            </PressableScale>
          </ScrollView>
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
  chips: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.xxl },
  newPost: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.caramel,
  },
  carousel: { gap: Spacing.md, paddingHorizontal: Gutter },
});
