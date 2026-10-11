import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { categoryById } from '@/data/categories';
import type { MapPlace } from '@/lib/map-places';
import { openPostcard } from '@/lib/navigation';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';

interface PlaceGalleryProps {
  places: MapPlace[];
  onShowOnMap: (placeId: string) => void;
  empty: ReactNode;
}

/** The same places as the map, as a visual grid. */
export function PlaceGallery({ places, onShowOnMap, empty }: PlaceGalleryProps) {
  const { width } = useWindowDimensions();
  const tileWidth = (width - Gutter * 2 - Spacing.md) / 2;

  if (places.length === 0) return <>{empty}</>;

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {places.map((mapPlace) => {
        const lead = mapPlace.postcards[0];
        return (
          <PressableScale
            key={mapPlace.place.id}
            accessibilityRole="button"
            accessibilityLabel={`${mapPlace.place.name}. Open postcard`}
            onPress={() => openPostcard(lead.postcard.id)}
            style={[styles.tile, { width: tileWidth }]}>
            <View>
              <PhotoView photo={lead.photo} aspect={0.9} style={styles.photo} />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Show ${mapPlace.place.name} on the map`}
                hitSlop={6}
                onPress={() => onShowOnMap(mapPlace.place.id)}
                style={styles.pin}>
                <Ionicons name="location" size={16} color={Colors.cherry} />
              </PressableScale>
            </View>
            <AppText variant="subheading" numberOfLines={1}>
              {mapPlace.place.name}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {categoryById(mapPlace.place.categories[0]).label} · {mapPlace.postcards.length}{' '}
              {mapPlace.postcards.length === 1 ? 'postcard' : 'postcards'}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: Spacing.xl, paddingHorizontal: Gutter, paddingBottom: Spacing.xxxl },
  tile: { gap: 4 },
  photo: { width: '100%', borderRadius: Radius.md },
  pin: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 247, 239, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
