import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { useNow } from '@/hooks/use-now';
import { type ScrapbookItem, toScrapbookItem } from '@/lib/feed';
import { openPostcard } from '@/lib/navigation';
import { canViewScrapbook, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Fonts, Gutter, Radius, Spacing } from '@/theme/tokens';

type Layout = 'collage' | 'itinerary';
const TILTS = [-2, 1.5, 1, -1.5, 2, -1];

function Collage({ item }: { item: ScrapbookItem }) {
  const { width } = useWindowDimensions();
  const tileWidth = (width - Gutter * 2 - Spacing.lg) / 2;
  return (
    <View style={styles.collage}>
      {item.stops.map((stop, index) => (
        <PressableScale
          key={stop.postcard.id}
          accessibilityRole="button"
          accessibilityLabel={`Open postcard: ${stop.place.name}`}
          onPress={() => openPostcard(stop.postcard.id)}
          style={[styles.collageItem, { width: tileWidth, transform: [{ rotate: `${TILTS[index % TILTS.length]}deg` }] }, index % 2 === 1 && styles.collageOffset]}>
          <PhotoView photo={stop.postcard.photo} aspect={index % 3 === 0 ? 0.8 : 1} style={styles.collagePhoto} />
          <AppText variant="subheading" numberOfLines={1} style={styles.collageCaption}>
            {stop.place.name}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

function Itinerary({ item }: { item: ScrapbookItem }) {
  return (
    <View>
      {item.stops.map((stop, index) => (
        <PressableScale
          key={stop.postcard.id}
          accessibilityRole="button"
          accessibilityLabel={`Stop ${index + 1}: ${stop.place.name}${stop.time ? ` at ${stop.time}` : ''}`}
          onPress={() => openPostcard(stop.postcard.id)}
          style={styles.stop}>
          <View style={styles.rail}>
            <View style={styles.number}>
              <AppText style={styles.numberText}>{index + 1}</AppText>
            </View>
            {index < item.stops.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.stopBody}>
            {stop.time ? <AppText variant="overline">{stop.time}</AppText> : null}
            <AppText variant="subheading">{stop.place.name}</AppText>
            <AppText variant="caption">{stop.place.neighborhood}</AppText>
            <AppText variant="body" color={Colors.chocolate} numberOfLines={2} style={styles.stopNote}>
              “{stop.postcard.note}”
            </AppText>
          </View>
          <PhotoView photo={stop.postcard.photo} aspect={1} style={styles.stopPhoto} />
        </PressableScale>
      ))}
    </View>
  );
}

export function ScrapbookDetailScreen() {
  const { id, justPublished } = useLocalSearchParams<{ id: string; justPublished?: string }>();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const scrapbook = content.scrapbookById.get(id);
  const hasTimes = scrapbook?.stops.some((s) => s.time) ?? false;
  const [layout, setLayout] = useState<Layout>('collage');

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

  const item = toScrapbookItem(content, scrapbook, now);
  const own = isOwn(scrapbook);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}>
        <View>
          <PhotoView photo={item.cover} aspect={1.05} style={styles.cover} label={`Cover of ${scrapbook.title}`} />
          <View style={styles.coverShade} />
        </View>

        <View style={styles.sheet}>
          {justPublished ? (
            <Notice
              icon="checkmark-circle"
              message={
                scrapbook.status === 'draft'
                  ? 'Draft saved. Only you can see it until you publish.'
                  : scrapbook.visibility === 'public'
                    ? 'Published! Your scrapbook now appears in Explore and Discover.'
                    : 'Saved privately. Only you can see it, from your profile.'
              }
            />
          ) : null}
          <AppText variant="overline">
            Scrapbook · {scrapbook.city} · {item.stops.length} places
          </AppText>
          <AppText variant="title">{scrapbook.title}</AppText>
          {scrapbook.description ? (
            <AppText variant="body" color={Colors.chocolate}>
              {scrapbook.description}
            </AppText>
          ) : null}
          <View style={styles.author}>
            <Avatar user={item.author} size={30} />
            <View style={styles.flex}>
              <AppText variant="label">{own ? `${item.author.name} (you)` : item.author.name}</AppText>
              <AppText variant="caption">@{item.author.handle}</AppText>
            </View>
            <StatusBadges item={scrapbook} now={now} />
          </View>

          <View style={styles.actions}>
            <Button
              label="See on map"
              icon="map-outline"
              variant="secondary"
              flex
              disabled={!item.stops.some((s) => s.place.coordinate)}
              onPress={() => router.push({ pathname: '/map', params: { scrapbookId: scrapbook.id } })}
            />
            {own ? (
              <Button
                label="Edit"
                icon="create-outline"
                onPress={() => router.push({ pathname: '/create/scrapbook', params: { id: scrapbook.id } })}
              />
            ) : null}
          </View>

          {item.stops.length === 0 ? (
            <EmptyState icon="images-outline" title="No postcards yet" message="Add postcards to bring this scrapbook to life." />
          ) : (
            <>
              <SegmentedControl<Layout>
                value={layout}
                onChange={setLayout}
                options={[
                  { value: 'collage', label: 'Collage' },
                  { value: 'itinerary', label: hasTimes ? 'Itinerary' : 'In order' },
                ]}
              />
              {layout === 'collage' ? <Collage item={item} /> : <Itinerary item={item} />}
            </>
          )}
        </View>
      </ScrollView>
      <TopBar floating />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  cover: { width: '100%' },
  coverShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 120, backgroundColor: 'rgba(33, 31, 28, 0.18)' },
  sheet: {
    marginTop: -Radius.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.cream,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
  collage: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, paddingTop: Spacing.md },
  collageItem: { padding: 6, paddingBottom: 10, backgroundColor: Colors.paper, borderRadius: 4, gap: 6, boxShadow: '0 3px 10px rgba(33, 31, 28, 0.12)' },
  collageOffset: { marginTop: Spacing.xl },
  collagePhoto: { width: '100%', borderRadius: 2 },
  collageCaption: { fontFamily: Fonts.serifItalic, fontSize: 15, color: Colors.chocolate, paddingHorizontal: 2 },
  stop: { flexDirection: 'row', gap: Spacing.md, minHeight: 112 },
  rail: { alignItems: 'center', width: 30 },
  number: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.cherry, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: Fonts.sansBold, fontSize: 13, color: Colors.cream },
  line: { flex: 1, width: 2, backgroundColor: Colors.sage, marginVertical: 4 },
  stopBody: { flex: 1, gap: 2, paddingBottom: Spacing.lg },
  stopNote: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  stopPhoto: { width: 72, borderRadius: Radius.sm },
});
