import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { MediaViewer } from '@/components/scrapbook/media-viewer';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MasonryGrid } from '@/components/ui/masonry-grid';
import { Notice } from '@/components/ui/notice';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TopBar } from '@/components/ui/top-bar';
import { categoryById } from '@/data/categories';
import { useNow } from '@/hooks/use-now';
import { scrapbookPlaceIds, toScrapbookItem } from '@/lib/feed';
import { canViewScrapbook, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Fonts, Gutter, Radius, Spacing } from '@/theme/tokens';

export function ScrapbookDetailScreen() {
  const { id, justPublished } = useLocalSearchParams<{ id: string; justPublished?: string }>();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const [viewing, setViewing] = useState<number | null>(null);
  const scrapbook = content.scrapbookById.get(id);

  if (!scrapbook || !canViewScrapbook(scrapbook)) {
    return (
      <View style={styles.screen}>
        <TopBar />
        <EmptyState
          icon="albums-outline"
          title="Scrapbook not available"
          message="Its creator may have made it private."
          actionLabel="Back to Explore"
          onAction={() => router.navigate('/')}
        />
      </View>
    );
  }

  const item = toScrapbookItem(content, scrapbook);
  const own = isOwn(scrapbook);
  const hasMapPlaces = [...scrapbookPlaceIds(scrapbook)].some((placeId) => content.placeById.get(placeId)?.coordinate);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}>
        <PhotoView photo={item.cover} aspect={1.25} style={styles.cover} label={`Cover of ${scrapbook.title}`} />

        <View style={styles.sheet}>
          {justPublished ? (
            <Notice
              icon="checkmark-circle"
              message={
                scrapbook.status === 'draft'
                  ? 'Draft saved. Only you can see it until you publish.'
                  : scrapbook.visibility === 'public'
                    ? 'Published! Your scrapbook now appears in Discover.'
                    : 'Saved privately. Only you can see it, under Your posts in Discover.'
              }
            />
          ) : null}
          <AppText variant="overline">
            Scrapbook · {scrapbook.city} · {item.media.length} photos
          </AppText>
          <AppText variant="title">{scrapbook.title}</AppText>
          {scrapbook.description ? (
            <AppText variant="body" color={Colors.slate}>
              {scrapbook.description}
            </AppText>
          ) : null}
          {scrapbook.categories.length > 0 ? (
            <View style={styles.tags}>
              {scrapbook.categories.map((c) => (
                <Badge key={c} label={categoryById(c).label} icon={categoryById(c).icon} />
              ))}
            </View>
          ) : null}
          <View style={styles.author}>
            <Avatar user={item.author} size={30} />
            <View style={styles.flex}>
              <AppText variant="label">{own ? `${item.author.name} (you)` : item.author.name}</AppText>
              <AppText variant="caption">@{item.author.handle}</AppText>
            </View>
            <StatusBadges item={scrapbook} now={now} />
          </View>

          {hasMapPlaces || own ? (
            <View style={styles.actions}>
              {hasMapPlaces ? (
                <Button
                  label="See on map"
                  icon="map-outline"
                  variant="secondary"
                  flex
                  onPress={() => router.push({ pathname: '/map', params: { scrapbookId: scrapbook.id } })}
                />
              ) : null}
              {own ? (
                <Button
                  label="Edit"
                  icon="create-outline"
                  flex={!hasMapPlaces}
                  onPress={() => router.push({ pathname: '/create/scrapbook', params: { id: scrapbook.id } })}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {item.media.length === 0 ? (
          <EmptyState icon="images-outline" title="No photos yet" message="Add photos to bring this scrapbook to life." />
        ) : (
          <MasonryGrid
            items={item.media}
            keyOf={(m) => m.id}
            aspectOf={(m, index) => m.photo.aspect * (index % 3 === 1 ? 0.8 : 1)}
            extraHeight={28}
            rowGap={Spacing.md}
            renderItem={(m, aspect) => (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={m.caption ? `Open photo: ${m.caption}` : 'Open photo'}
                onPress={() => setViewing(item.media.indexOf(m))}
                style={styles.tile}>
                <PhotoView photo={m.photo} aspect={aspect} style={styles.tilePhoto} />
                {m.caption ? (
                  <AppText numberOfLines={2} style={styles.caption}>
                    {m.caption}
                  </AppText>
                ) : null}
              </PressableScale>
            )}
          />
        )}
      </ScrollView>
      <TopBar floating />
      <MediaViewer media={item.media} index={viewing} content={content} onChangeIndex={setViewing} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  cover: { width: '100%' },
  sheet: {
    marginTop: -Radius.xl,
    marginBottom: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.background,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  tile: { gap: 6 },
  tilePhoto: { width: '100%', borderRadius: Radius.md },
  caption: { fontFamily: Fonts.sansItalic, fontSize: 13, lineHeight: 18, color: Colors.slate, paddingHorizontal: 2 },
});
