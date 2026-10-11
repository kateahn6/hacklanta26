import { ScrollView, StyleSheet } from 'react-native';

import { CATEGORIES } from '@/data/categories';
import { Gutter, Spacing } from '@/theme/tokens';
import type { CategoryId } from '@/types';

import { Chip } from './chip';

interface CategoryChipsProps {
  value: CategoryId | null;
  onChange: (category: CategoryId | null) => void;
  floating?: boolean;
}

export function CategoryChips({ value, onChange, floating }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled">
      <Chip label="All" selected={value === null} onPress={() => onChange(null)} floating={floating} />
      {CATEGORIES.map((category) => (
        <Chip
          key={category.id}
          label={category.label}
          icon={category.icon}
          selected={value === category.id}
          onPress={() => onChange(value === category.id ? null : category.id)}
          floating={floating}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.sm, paddingHorizontal: Gutter, paddingVertical: Spacing.xs },
});
