import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { IconName } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/theme/tokens';

interface ShortcutCardProps {
  icon: IconName;
  title: string;
  detail: string;
  onPress: () => void;
  tone: 'sage' | 'cherry';
}

export function ShortcutCard({ icon, title, detail, onPress, tone }: ShortcutCardProps) {
  const sage = tone === 'sage';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={[styles.card, { backgroundColor: sage ? Colors.blackOlive : Colors.cherry }]}>
      <View style={[styles.icon, { backgroundColor: sage ? Colors.olive : 'rgba(241, 232, 216, 0.16)' }]}>
        <Ionicons name={icon} size={18} color={Colors.cream} />
      </View>
      <View style={styles.text}>
        <AppText variant="label" color={Colors.cream}>
          {title}
        </AppText>
        <AppText variant="caption" color={sage ? Colors.sage : Colors.cherrySoft} numberOfLines={2}>
          {detail}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
});
