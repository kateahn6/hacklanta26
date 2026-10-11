import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';

interface NoticeProps {
  icon: IconName;
  message: string;
  tone?: 'sage' | 'cherry' | 'caramel';
}

const TONES = {
  sage: { bg: Colors.sageSoft, fg: Colors.blackOlive },
  cherry: { bg: Colors.cherrySoft, fg: Colors.cherry },
  caramel: { bg: '#F2E3CF', fg: Colors.chocolate },
};

export function Notice({ icon, message, tone = 'sage' }: NoticeProps) {
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
