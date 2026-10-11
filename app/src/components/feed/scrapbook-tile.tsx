import { StyleSheet, View } from 'react-native';

import { AuthorLine } from '@/components/cards/author-line';
import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { ScrapbookItem } from '@/lib/feed';
import { openScrapbook } from '@/lib/navigation';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

/** Horizontal-carousel tile for a scrapbook. */
export function ScrapbookTile({ item, width }: { item: ScrapbookItem; width: number }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Scrapbook: ${item.scrapbook.title}, ${item.media.length} photos`}
      onPress={() => openScrapbook(item.scrapbook.id)}
      style={[styles.tile, { width }]}>
      <View style={styles.photoWrap}>
        <PhotoView photo={item.cover} aspect={1.2} style={styles.photo} />
        <View style={styles.count}>
          <AppText style={styles.countText}>{item.media.length} photos</AppText>
        </View>
      </View>
      <AppText variant="subheading" numberOfLines={2}>
        {item.scrapbook.title}
      </AppText>
      <AuthorLine author={item.author} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { gap: Spacing.sm },
  photoWrap: { borderRadius: Radius.lg, overflow: 'hidden' },
  photo: { width: '100%' },
  count: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(41, 46, 30, 0.82)',
  },
  countText: { fontFamily: Fonts.sansSemiBold, fontSize: 11, color: Colors.cream },
});
