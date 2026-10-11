import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { PostcardItem } from '@/lib/feed';
import { Colors, Radius, Spacing } from '@/theme/tokens';

import { AuthorLine } from './author-line';
import { StatusBadges } from './status-badges';

interface PostcardCardProps {
  item: PostcardItem;
  aspect: number;
  now: number;
  onPress: () => void;
}

/** A single place: one photo in a thin print-style mat. */
export function PostcardCard({ item, aspect, now, onPress }: PostcardCardProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Postcard: ${item.place.name}, ${item.place.neighborhood}, by ${item.author.name}`}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.mat}>
        <PhotoView photo={item.photo} aspect={aspect} style={styles.photo} />
        <View style={styles.badges}>
          <StatusBadges item={item.postcard} now={now} />
        </View>
      </View>
      <View style={styles.text}>
        <AppText variant="subheading" numberOfLines={2}>
          {item.place.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {item.place.neighborhood}
        </AppText>
        <AuthorLine author={item.author} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  mat: {
    padding: 5,
    paddingBottom: 14,
    borderRadius: Radius.sm + 2,
    backgroundColor: Colors.paper,
    boxShadow: '0 1px 4px rgba(33, 31, 28, 0.10)',
  },
  photo: { width: '100%', borderRadius: 3 },
  badges: { position: 'absolute', left: 11, bottom: 20, right: 11 },
  text: { gap: 3, paddingHorizontal: 2 },
});
