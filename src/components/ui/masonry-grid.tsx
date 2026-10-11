import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Gutter, Spacing } from '@/theme/tokens';

const COLUMN_GAP = Spacing.md;

interface MasonryGridProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  /** Width / height of the item's image. */
  aspectOf: (item: T, index: number) => number;
  /** Height of anything rendered below the image, used to balance columns. */
  extraHeight?: number;
  rowGap?: number;
  renderItem: (item: T, aspect: number, width: number) => ReactNode;
}

/** Keeps crops pleasant: no ultra-tall or ultra-wide tiles. */
const clampAspect = (aspect: number) => Math.min(1.25, Math.max(0.72, aspect));

/** Two-column Pinterest-style layout. Each item goes into the currently shorter column. */
export function MasonryGrid<T>({ items, keyOf, aspectOf, extraHeight = 0, rowGap = Spacing.xl, renderItem }: MasonryGridProps<T>) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - Gutter * 2 - COLUMN_GAP) / 2;

  const columns: { item: T; aspect: number }[][] = [[], []];
  const heights = [0, 0];
  items.forEach((item, index) => {
    const aspect = clampAspect(aspectOf(item, index));
    const column = heights[0] <= heights[1] ? 0 : 1;
    columns[column].push({ item, aspect });
    heights[column] += columnWidth / aspect + extraHeight + rowGap;
  });

  return (
    <View style={styles.row}>
      {columns.map((column, i) => (
        <View key={i} style={[styles.column, { width: columnWidth, gap: rowGap }]}>
          {column.map(({ item, aspect }) => (
            <View key={keyOf(item)}>{renderItem(item, aspect, columnWidth)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: COLUMN_GAP, paddingHorizontal: Gutter, alignItems: 'flex-start' },
  column: {},
});
