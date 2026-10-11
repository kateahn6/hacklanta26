import { Image, StyleSheet, Text, View } from 'react-native';

import type { MapPlace } from '@/lib/map-places';
import { Colors, Fonts } from '@/theme/tokens';

interface MapMarkerProps {
  mapPlace: MapPlace;
  selected: boolean;
  /** Small alternating tilt so pins read like dropped postcards. */
  tilt: number;
}

/** A miniature postcard pin: the place's photo in a cream mat, with a count when several postcards share it. */
export function MapMarker({ mapPlace, selected, tilt }: MapMarkerProps) {
  const photo = mapPlace.postcards.find((p) => p.photo)?.photo;
  const size = selected ? 56 : 42;
  const count = mapPlace.postcards.length;

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, selected && styles.frameSelected, { transform: [{ rotate: `${selected ? 0 : tilt}deg` }] }]}>
        {photo ? (
          <Image source={photo.source} style={{ width: size, height: size, borderRadius: 3 }} />
        ) : (
          <View style={{ width: size, height: size, backgroundColor: Colors.creamDeep }} />
        )}
        {count > 1 ? (
          <View style={styles.count}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.pointer, selected && styles.pointerSelected]} />
      {selected ? (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>
            {mapPlace.place.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 4 },
  frame: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: 'rgba(33, 31, 28, 0.15)',
  },
  frameSelected: { backgroundColor: Colors.cherry, borderColor: Colors.cherry, padding: 4 },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.paper,
    marginTop: -1,
  },
  pointerSelected: { borderTopColor: Colors.cherry },
  count: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.olive,
    borderWidth: 2,
    borderColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: Fonts.sansBold, fontSize: 10.5, color: Colors.cream },
  label: {
    marginTop: 3,
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.softBlack,
  },
  labelText: { fontFamily: Fonts.sansSemiBold, fontSize: 11.5, color: Colors.cream },
});
