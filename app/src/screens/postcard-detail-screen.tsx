import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { PostcardView } from '@/components/postcard/postcard-view';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoTile } from '@/components/ui/info-tile';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { useNow } from '@/hooks/use-now';
import { toPostcardItem } from '@/lib/feed';
import { formatDate } from '@/lib/format';
import { canViewPostcard, expiryLabel, isExpired, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

export function PostcardDetailScreen() {
  const { id, justPublished } = useLocalSearchParams<{ id: string; justPublished?: string }>();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();

  const postcard = content.postcardById.get(id);
  const item = postcard && canViewPostcard(postcard, now) ? toPostcardItem(content, postcard) : null;

  if (!postcard || !item) {
    return (
      <View style={styles.screen}>
        <TopBar />
        <EmptyState
          icon="mail-unread-outline"
          title="Postcard not available"
          message="It may have expired or been made private by its creator."
          actionLabel="Back to Explore"
          onAction={() => router.navigate('/')}
        />
      </View>
    );
  }

  const own = isOwn(postcard);
  const coordinate = item.place.coordinate;

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}>
        {justPublished ? (
          <Notice
            icon="checkmark-circle"
            tone="sky"
            message={
              postcard.status === 'draft'
                ? 'Draft saved. Only you can see it until you publish.'
                : postcard.visibility === 'public'
                  ? 'Published! It now appears in Explore, Discover, and on the map.'
                  : 'Saved privately. Only you can see it, under Your posts in Discover.'
            }
          />
        ) : null}

        <PostcardView
          photo={item.photo}
          note={postcard.note}
          place={item.place}
          author={item.author}
          date={postcard.visitedOn ?? postcard.createdAt}
          isOwn={own}
          meta={<StatusBadges item={postcard} now={now} />}
        />

        {postcard.visitedOn ? (
          <View style={styles.tiles}>
            <InfoTile icon="calendar-outline" label="Visited" value={formatDate(postcard.visitedOn)} />
          </View>
        ) : null}
        {postcard.tip ? <Notice icon="bulb-outline" tone="slate" message={`Tip: ${postcard.tip}`} /> : null}

        {own && postcard.status === 'published' && postcard.expiresAt ? (
          <Notice
            icon="time-outline"
            tone="navy"
            message={
              isExpired(postcard, now)
                ? 'Expired. It no longer appears in public discovery.'
                : `${expiryLabel(postcard.expiresAt, now)}. After that it leaves public discovery.`
            }
          />
        ) : null}

        <View style={styles.actions}>
          {coordinate ? (
            <Button
              label="View on map"
              icon="map-outline"
              variant="secondary"
              flex
              onPress={() => router.push({ pathname: '/map', params: { placeId: item.place.id } })}
            />
          ) : (
            <View style={styles.flex}>
              <AppText variant="caption">This place hasn’t been pinned on the map yet.</AppText>
            </View>
          )}
          {own ? (
            <Button
              label={postcard.status === 'draft' ? 'Finish draft' : 'Edit'}
              icon="create-outline"
              flex
              onPress={() => router.push({ pathname: '/create/postcard', params: { id: postcard.id } })}
            />
          ) : null}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, gap: Spacing.lg },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
