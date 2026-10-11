import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gutter, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

interface TopBarProps {
  title?: string;
  right?: ReactNode;
  /** Overlay the bar on top of content (e.g. a hero photo). */
  floating?: boolean;
  backIcon?: 'arrow-back' | 'close';
  /** Overrides the default back navigation. */
  onBack?: () => void;
}

export function TopBar({ title, right, floating, backIcon = 'arrow-back', onBack }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View style={[styles.bar, { paddingTop: insets.top + Spacing.sm }, floating && styles.floating]}>
      <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={goBack} variant={floating ? 'surface' : 'clear'} />
      <AppText variant="subheading" numberOfLines={1} style={styles.title}>
        {title ?? ''}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Gutter - 8, paddingBottom: Spacing.sm },
  floating: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: 44, alignItems: 'flex-end' },
});
