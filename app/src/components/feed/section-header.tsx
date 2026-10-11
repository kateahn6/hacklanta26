import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Gutter, Spacing } from '@/theme/tokens';

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="heading">{title}</AppText>
      {detail ? <AppText variant="caption">{detail}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Gutter,
    marginBottom: Spacing.md,
  },
});
