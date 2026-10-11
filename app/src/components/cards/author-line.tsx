import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import type { User } from '@/types';

export function AuthorLine({ author, size = 18 }: { author: User; size?: number }) {
  return (
    <View style={styles.row}>
      <Avatar user={author} size={size} />
      <AppText variant="caption" numberOfLines={1} style={styles.name}>
        {author.name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1 },
});
