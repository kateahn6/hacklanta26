import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/cards/masonry-feed';
import { ScrapbookTile } from '@/components/feed/scrapbook-tile';
import { buildMyPosts, MyPostTile } from '@/components/feed/my-post-tile';
import { SectionHeader } from '@/components/feed/section-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
import { DEMO_USER_ID } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
import { api } from '@/lib/api';
import { useApiContent } from '@/lib/api-content';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { buildPublicFeed, filterFeed, type PostcardItem, type ScrapbookItem } from '@/lib/feed';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId } from '@/types';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const content = useContent();
  const now = useNow();
  const { profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState<'invite' | 'demo' | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareDone, setShareDone] = useState<string | null>(null);
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

  const createInvite = async () => {
    setShareBusy('invite');
    setShareError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ code: string }>('/api/friends/invite', {
        method: 'POST',
        token,
        profile,
      });
      setInviteCode(res.code);
      await Clipboard.setStringAsync(res.code);
      setShareDone(`Code ${res.code} copied. Send it to a friend.`);
    } catch (err: any) {
      setShareError(err?.message ?? 'Could not create an invite code.');
    } finally {
      setShareBusy(null);
    }
  };

  /** Befriends every seeded demo account, so the map fills up immediately. */
  const joinDemo = async () => {
    setShareBusy('demo');
    setShareError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ friends: { name: string | null }[] }>('/api/demo/befriend', {
        method: 'POST',
        token,
        profile,
      });
      await refresh();
      setShareDone(`Now sharing a map with ${res.friends.map((f) => f.name ?? 'a friend').join(', ')}.`);
    } catch (err: any) {
      setShareError(err?.message ?? 'Could not join the demo map.');
    } finally {
      setShareBusy(null);
    }
  };

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
      {!filtering ? (
        <View style={styles.sharing}>
          <SectionHeader title="Your friends&rsquo; map" detail="Swap a code to merge maps" />
          {inviteCode ? <AppText variant="display" style={styles.code}>{inviteCode}</AppText> : null}
          {shareError ? <Notice icon="warning-outline" tone="cherry" message={shareError} /> : null}
          {shareDone ? <Notice icon="checkmark-circle-outline" message={shareDone} /> : null}
          <View style={styles.shareRow}>
            <Button
              label={inviteCode ? 'Share code' : 'Invite a friend'}
              icon={inviteCode ? 'share-outline' : 'person-add-outline'}
              loading={shareBusy === 'invite'}
              flex
              onPress={
                inviteCode
                  ? () =>
                      Share.share({
                        message: `Join my noted! map — open the app and enter code ${inviteCode}`,
                      })
                  : createInvite
              }
            />
            <Button
              label="Join demo map"
              variant="secondary"
              icon="map-outline"
              loading={shareBusy === 'demo'}
              flex
              onPress={joinDemo}
            />
          </View>
        </View>
      ) : null}

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
  screen: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: Gutter, gap: Spacing.md },
  chips: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  sharing: { paddingHorizontal: Gutter, gap: Spacing.sm, marginTop: Spacing.lg },
  shareRow: { flexDirection: 'row', gap: Spacing.sm },
  code: { color: Colors.cherry, letterSpacing: 8, textAlign: 'center' },
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
  noPosts: { paddingHorizontal: Gutter },
  carousel: { gap: Spacing.md, paddingHorizontal: Gutter },
});
