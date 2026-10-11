import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';

const TONES = {
  sage: { bg: Colors.sageSoft, fg: Colors.blackOlive },
  cherry: { bg: Colors.cherrySoft, fg: Colors.cherry },
  dark: { bg: 'rgba(33, 31, 28, 0.72)', fg: Colors.cream },
  caramel: { bg: '#F2E3CF', fg: Colors.chocolate },
} as const;

interface BadgeProps {
  label: string;
  icon?: IconName;
  tone?: keyof typeof TONES;
}

export function Badge({ label, icon, tone = 'sage' }: BadgeProps) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={fg} /> : null}
      <AppText style={[styles.label, { color: fg }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 11 },
});
