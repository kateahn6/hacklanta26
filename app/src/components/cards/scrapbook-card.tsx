import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { ScrapbookItem } from '@/lib/feed';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

import { AuthorLine } from './author-line';
import { StatusBadges } from './status-badges';

interface ScrapbookCardProps {
  item: ScrapbookItem;
  aspect: number;
  now: number;
  onPress: () => void;
}

/** A scrapbook: cover photo on a small stack of pages, with a photo count. */
export function ScrapbookCard({ item, aspect, now, onPress }: ScrapbookCardProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Scrapbook: ${item.scrapbook.title}, ${item.media.length} photos, by ${item.author.name}`}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.stack}>
        <View style={[styles.page, styles.pageBack]} />
        <View style={[styles.page, styles.pageMid]} />
        <View style={styles.cover}>
          <PhotoView photo={item.cover} aspect={aspect} style={styles.photo} />
          <View style={styles.count}>
            <Ionicons name="albums-outline" size={12} color={Colors.white} />
            <AppText style={styles.countText}>{item.media.length} photos</AppText>
          </View>
        </View>
      </View>
      <View style={styles.text}>
        <AppText variant="overline">Scrapbook</AppText>
        <AppText variant="subheading" numberOfLines={2}>
          {item.scrapbook.title}
        </AppText>
        <AuthorLine author={item.author} />
        <StatusBadges item={item.scrapbook} now={now} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  stack: { paddingTop: 8, paddingRight: 6 },
  page: { position: 'absolute', top: 0, bottom: 8, left: 8, right: 0, borderRadius: Radius.md },
  pageBack: { backgroundColor: Colors.sky, transform: [{ rotate: '3deg' }] },
  pageMid: { backgroundColor: Colors.navySoft, top: 4, left: 4, right: 3, transform: [{ rotate: '-1.5deg' }] },
  cover: { borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.backgroundDeep },
  photo: { width: '100%' },
  count: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(22, 44, 94, 0.82)',
  },
  countText: { fontFamily: Fonts.sansSemiBold, fontSize: 11, color: Colors.white },
  text: { gap: 3, paddingHorizontal: 2 },
});
