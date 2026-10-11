import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AuthorLine } from '@/components/cards/author-line';
import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SaveButton } from '@/components/ui/save-button';
import type { ScrapbookItem } from '@/lib/feed';
import { openScrapbook } from '@/lib/navigation';
import { Colors, Radius, Spacing } from '@/theme/tokens';

export function FeaturedCard({ item }: { item: ScrapbookItem }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Featured scrapbook: ${item.scrapbook.title}. Explore the collection.`}
      onPress={() => openScrapbook(item.scrapbook.id)}
      style={styles.card}>
      <View>
        <PhotoView photo={item.cover} aspect={1.45} style={styles.photo} />
        <View style={styles.tag}>
          <AppText variant="overline" color={Colors.cream}>
            Featured scrapbook
          </AppText>
        </View>
        <View style={styles.save}>
          <SaveButton kind="scrapbook" id={item.scrapbook.id} />
        </View>
      </View>
      <View style={styles.body}>
        <AppText variant="title">{item.scrapbook.title}</AppText>
        <AppText variant="body" color={Colors.chocolate}>
          {item.scrapbook.description}
        </AppText>
        <View style={styles.footer}>
          <AuthorLine author={item.author} size={22} />
          <View style={styles.cta}>
            <AppText variant="label" color={Colors.cherry}>
              Explore {item.stops.length} places
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={Colors.cherry} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, backgroundColor: Colors.paper, overflow: 'hidden' },
  photo: { width: '100%' },
  tag: {
    position: 'absolute',
    left: Spacing.md,
    top: Spacing.md,
    backgroundColor: Colors.cherry,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  save: { position: 'absolute', right: Spacing.md, top: Spacing.md },
  body: { padding: Spacing.lg, gap: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
