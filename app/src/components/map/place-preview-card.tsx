import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AuthorLine } from '@/components/cards/author-line';
import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { categoryById } from '@/data/categories';
import type { MapPlace } from '@/lib/map-places';
import { openPostcard } from '@/lib/navigation';
import { Colors, Radius, Spacing } from '@/theme/tokens';

interface PlacePreviewCardProps {
  mapPlace: MapPlace;
  selected: boolean;
  width: number;
}

/** Bottom preview for a map place: lead postcard plus thumbnails of the other experiences there. */
export function PlacePreviewCard({ mapPlace, selected, width }: PlacePreviewCardProps) {
  const [lead, ...others] = mapPlace.postcards;
  const { place } = mapPlace;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${place.name}. Open postcard by ${lead.author.name}`}
      onPress={() => openPostcard(lead.postcard.id)}
      style={[styles.card, { width }, selected && styles.selected]}>
      <View style={styles.row}>
        <PhotoView photo={lead.photo} aspect={0.82} style={styles.photo} />
        <View style={styles.body}>
          <AppText variant="overline" numberOfLines={1}>
            {place.categories.map((c) => categoryById(c).label).join(' · ')}
          </AppText>
          <AppText variant="subheading" numberOfLines={1}>
            {place.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {place.neighborhood}
          </AppText>
          <AppText variant="body" style={styles.note} numberOfLines={2}>
            “{lead.postcard.note}”
          </AppText>
          <AuthorLine author={lead.author} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
      </View>
      {others.length > 0 ? (
        <View style={styles.more}>
          <AppText variant="caption">{others.length === 1 ? '1 more postcard here' : `${others.length} more postcards here`}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {others.map((other) => (
              <PressableScale
                key={other.key}
                accessibilityRole="button"
                accessibilityLabel={`Postcard by ${other.author.name}`}
                onPress={() => openPostcard(other.postcard.id)}>
                {other.photo ? <Image source={other.photo.source} style={styles.thumb} /> : <View style={styles.thumb} />}
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.paper,
    boxShadow: '0 4px 16px rgba(33, 31, 28, 0.16)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: { borderColor: Colors.cherry },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  photo: { width: 84, borderRadius: Radius.sm },
  body: { flex: 1, gap: 2 },
  note: { fontSize: 13.5, lineHeight: 19, color: Colors.chocolate, marginVertical: 2 },
  more: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline, paddingTop: Spacing.sm },
  thumbs: { gap: 6 },
  thumb: { width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.creamDeep },
});
