import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { categoryById } from '@/data/categories';
import type { MapPlace } from '@/lib/map-places';
import { openPostcard } from '@/lib/navigation';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

interface PlacePreviewCardProps {
  mapPlace: MapPlace;
  selected: boolean;
  width: number;
}

/** Compact bottom preview for a map place. Opens the place's newest postcard. */
export function PlacePreviewCard({ mapPlace, selected, width }: PlacePreviewCardProps) {
  const [lead, ...others] = mapPlace.postcards;
  const { place } = mapPlace;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.neighborhood}. ${others.length > 0 ? `${others.length + 1} postcards. ` : ''}Open postcard by ${lead.author.name}`}
      onPress={() => openPostcard(lead.postcard.id)}
      style={[styles.card, { width }, selected && styles.selected]}>
      <PhotoView photo={lead.photo} aspect={1} style={styles.photo} />
      <View style={styles.body}>
        <AppText variant="overline" numberOfLines={1} style={styles.category}>
          {categoryById(place.categories[0]).label}
        </AppText>
        <AppText variant="label" numberOfLines={1}>
          {place.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.note}>
          “{lead.postcard.note}”
        </AppText>
      </View>
      {others.length > 0 ? (
        <View style={styles.more}>
          <AppText style={styles.moreText}>+{others.length}</AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    boxShadow: '0 3px 12px rgba(22, 44, 94, 0.16)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: { borderColor: Colors.navy },
  photo: { width: 56, borderRadius: Radius.sm },
  body: { flex: 1, gap: 1 },
  category: { fontSize: 10 },
  note: { fontFamily: Fonts.sansItalic, color: Colors.slate },
  more: {
    minWidth: 28,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontFamily: Fonts.sansBold, fontSize: 11, color: Colors.navy },
});
