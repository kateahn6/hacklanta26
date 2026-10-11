import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';

const TONES = {
  sky: { bg: Colors.skySoft, fg: Colors.navy },
  navy: { bg: Colors.navySoft, fg: Colors.navy },
  dark: { bg: 'rgba(0, 0, 0, 0.7)', fg: Colors.white },
  slate: { bg: Colors.backgroundDeep, fg: Colors.slate },
} as const;

interface BadgeProps {
  label: string;
  icon?: IconName;
  tone?: keyof typeof TONES;
}

export function Badge({ label, icon, tone = 'sky' }: BadgeProps) {
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
