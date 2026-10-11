import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { type FeedItem, itemAspect } from '@/lib/feed';
import { Gutter, Spacing } from '@/theme/tokens';

import { ExperienceCard } from './experience-card';

const COLUMN_GAP = Spacing.md;
const ROW_GAP = Spacing.xl;

/** Keeps crops pleasant: no ultra-tall or ultra-wide tiles. */
const clampAspect = (aspect: number) => Math.min(1.25, Math.max(0.72, aspect));

interface MasonryFeedProps {
  items: FeedItem[];
  now: number;
}

/** Two-column Pinterest-style feed. Each card goes into the currently shorter column. */
export function MasonryFeed({ items, now }: MasonryFeedProps) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - Gutter * 2 - COLUMN_GAP) / 2;

  const columns: { item: FeedItem; aspect: number }[][] = [[], []];
  const heights = [0, 0];
  items.forEach((item, index) => {
    // Vary crops slightly so neighboring photos with the same ratio don't line up.
    const aspect = clampAspect(itemAspect(item) * (index % 3 === 1 ? 0.82 : 1));
    const textHeight = item.kind === 'scrapbook' ? 96 : 76;
    const column = heights[0] <= heights[1] ? 0 : 1;
    columns[column].push({ item, aspect });
    heights[column] += columnWidth / aspect + textHeight + ROW_GAP;
  });

  return (
    <View style={styles.row}>
      {columns.map((column, i) => (
        <View key={i} style={[styles.column, { width: columnWidth }]}>
          {column.map(({ item, aspect }) => (
            <ExperienceCard key={item.key} item={item} aspect={aspect} now={now} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: COLUMN_GAP, paddingHorizontal: Gutter, alignItems: 'flex-start' },
  column: { gap: ROW_GAP },
});
