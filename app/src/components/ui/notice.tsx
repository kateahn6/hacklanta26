import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';

interface NoticeProps {
  icon: IconName;
  message: string;
  tone?: 'sky' | 'navy' | 'slate';
}

const TONES = {
  sky: { bg: Colors.skySoft, fg: Colors.navy },
  navy: { bg: Colors.navySoft, fg: Colors.navy },
  slate: { bg: Colors.backgroundDeep, fg: Colors.slate },
};

export function Notice({ icon, message, tone = 'sky' }: NoticeProps) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]} accessibilityRole="text">
      <Ionicons name={icon} size={18} color={fg} />
      <AppText variant="body" color={fg} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'flex-start' },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
});
