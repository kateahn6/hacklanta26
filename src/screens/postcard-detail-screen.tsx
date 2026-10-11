import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoTile } from '@/components/ui/info-tile';
import { Notice } from '@/components/ui/notice';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SaveButton } from '@/components/ui/save-button';
import { TopBar } from '@/components/ui/top-bar';
import { categoryById } from '@/data/categories';
import { useNow } from '@/hooks/use-now';
import { toPostcardItem } from '@/lib/feed';
import { formatDate } from '@/lib/format';
import { openScrapbook } from '@/lib/navigation';
import { canViewPostcard, canViewScrapbook, expiryLabel, isExpired, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';

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
  const inScrapbooks = content.scrapbooks.filter(
    (s) => canViewScrapbook(s) && s.stops.some((stop) => stop.postcardId === postcard.id),
  );
  const coordinate = item.place.coordinate;

  return (
    <View style={styles.screen}>
      <TopBar right={postcard.status === 'published' ? <SaveButton kind="postcard" id={postcard.id} /> : null} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}>
        {justPublished ? (
          <Notice
            icon="checkmark-circle"
            tone="sage"
            message={
              postcard.status === 'draft'
                ? 'Draft saved. Only you can see it until you publish.'
                : postcard.visibility === 'public'
                  ? 'Published! It now appears in Explore, Discover, and on the map.'
                  : 'Saved privately. Only you can see it, from your profile.'
            }
          />
        ) : null}

        <View style={styles.mat}>
          <PhotoView
            photo={item.photo}
            aspect={Math.min(1.4, Math.max(0.8, item.photo?.aspect ?? 1))}
            style={styles.photo}
            label={`Photo of ${item.place.name}`}
          />
        </View>

        <View style={styles.titleBlock}>
          {item.categories.length > 0 ? (
            <AppText variant="overline">{item.categories.map((c) => categoryById(c).label).join(' · ')}</AppText>
          ) : null}
          <AppText variant="title">{item.place.name}</AppText>
          <AppText variant="body" color={Colors.muted}>
            {item.place.neighborhood ? `${item.place.neighborhood}, ` : ''}
            {item.place.city}
          </AppText>
          <StatusBadges item={postcard} now={now} />
        </View>

        <View style={styles.back}>
          <AppText variant="note">“{postcard.note || 'No note yet.'}”</AppText>
          <View style={styles.signature}>
            <Avatar user={item.author} size={32} />
            <View>
              <AppText variant="label">{own ? `${item.author.name} (you)` : item.author.name}</AppText>
              <AppText variant="caption">@{item.author.handle}</AppText>
            </View>
          </View>
        </View>

        {postcard.visitedOn || postcard.cost || postcard.tip ? (
          <View style={styles.tiles}>
            {postcard.visitedOn ? <InfoTile icon="calendar-outline" label="Visited" value={formatDate(postcard.visitedOn)} /> : null}
            {postcard.cost ? <InfoTile icon="wallet-outline" label="Cost" value={postcard.cost} /> : null}
          </View>
        ) : null}
        {postcard.tip ? <Notice icon="bulb-outline" tone="caramel" message={`Tip: ${postcard.tip}`} /> : null}

        {own && postcard.status === 'published' && postcard.expiresAt ? (
          <Notice
            icon="time-outline"
            tone="cherry"
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

        {inScrapbooks.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="heading">Part of</AppText>
            {inScrapbooks.map((s) => (
              <PressableScale
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`Open scrapbook ${s.title}`}
                onPress={() => openScrapbook(s.id)}
                style={styles.scrapbookLink}>
                <AppText variant="label" style={styles.flex} numberOfLines={1}>
                  {s.title}
                </AppText>
                <AppText variant="caption">{s.stops.length} places</AppText>
              </PressableScale>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, gap: Spacing.lg },
  mat: {
    padding: 8,
    paddingBottom: 26,
    backgroundColor: Colors.paper,
    borderRadius: Radius.sm,
    transform: [{ rotate: '-0.8deg' }],
    boxShadow: '0 6px 20px rgba(33, 31, 28, 0.14)',
  },
  photo: { width: '100%', borderRadius: 3 },
  titleBlock: { gap: Spacing.xs, marginTop: Spacing.sm },
  back: {
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
    borderLeftWidth: 3,
    borderLeftColor: Colors.caramel,
  },
  signature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  section: { gap: Spacing.sm, marginTop: Spacing.sm },
  scrapbookLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
  },
});
