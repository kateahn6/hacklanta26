import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import type { Photo, Place } from '@/types';

import { PostcardBack } from './postcard-back';

/** Standard landscape postcard proportions (6 × 4 in). */
const POSTCARD_ASPECT = 1.5;

interface FlipPostcardProps {
  photo: Photo | null;
  note: string;
  signedBy: string;
  place: Place;
  date: string;
}

/** Tap to turn the postcard over: photo on the front, handwritten note on the back. */
export function FlipPostcard({ photo, note, signedBy, place, date }: FlipPostcardProps) {
  const [showingBack, setShowingBack] = useState(false);
  const flip = useSharedValue(0);

  const toggle = () => {
    const next = !showingBack;
    setShowingBack(next);
    flip.value = withTiming(next ? 1 : 0, { duration: 650, easing: Easing.inOut(Easing.cubic) });
  };

  // Opacity swaps at the midpoint as a fallback where backface culling is unreliable (some Android devices).
  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 0 : 1,
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showingBack ? `Back of postcard. Note: ${note}. Signed ${signedBy}.` : `Postcard photo of ${place.name}`}
        accessibilityHint={showingBack ? 'Flips to the photo' : 'Flips the postcard to read the note'}
        onPress={toggle}
        style={[styles.card, { aspectRatio: POSTCARD_ASPECT }]}>
        <Animated.View style={[styles.face, frontStyle]}>
          <View style={styles.front}>
            <PhotoView photo={photo} aspect={POSTCARD_ASPECT} style={styles.photo} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.face, backStyle]}>
          <PostcardBack note={note} signedBy={signedBy} place={place} photo={photo} date={date} />
        </Animated.View>
      </Pressable>
      <View style={styles.hint} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="sync-outline" size={14} color={Colors.textMuted} />
        <AppText variant="caption">{showingBack ? 'Tap to see the photo' : 'Tap the postcard to read the note'}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  card: { width: '100%' },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    boxShadow: '0 6px 20px rgba(22, 44, 94, 0.16)',
  },
  front: { flex: 1, padding: 8, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  photo: { width: '100%', height: '100%', borderRadius: 3 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
