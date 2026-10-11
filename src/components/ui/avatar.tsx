import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { Colors, Fonts } from '@/theme/tokens';
import type { User } from '@/types';

import { AppText } from './app-text';

const TONES = [Colors.olive, Colors.cherry, Colors.chocolate, Colors.blackOlive, Colors.caramel];

function toneFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

export function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <View
      accessibilityLabel={user.name}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: toneFor(user.id) }]}>
      <AppText style={[styles.initials, { fontSize: size * 0.4 }]}>{initials(user.name)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Fonts.sansBold, color: Colors.cream },
});
