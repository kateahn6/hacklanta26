import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import { useAppStore, useIsSaved } from '@/store/app-store';
import { Colors } from '@/theme/tokens';
import type { SavedKind } from '@/types';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface SaveButtonProps {
  kind: SavedKind;
  id: string;
  /** "overlay" sits on photos; "pill" shows a text label. */
  variant?: 'overlay' | 'pill';
}

export function SaveButton({ kind, id, variant = 'overlay' }: SaveButtonProps) {
  const saved = useIsSaved(kind, id);
  const toggleSaved = useAppStore((s) => s.toggleSaved);
  const label = saved ? 'Saved' : 'Save';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove from saved` : `Save ${kind}`}
      accessibilityState={{ selected: saved }}
      hitSlop={8}
      onPress={() => toggleSaved({ kind, id })}
      style={variant === 'overlay' ? styles.overlay : [styles.pill, saved && styles.pillSaved]}>
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={variant === 'overlay' ? 16 : 18}
        color={variant === 'pill' && saved ? Colors.cream : Colors.cherry}
      />
      {variant === 'pill' ? (
        <AppText variant="label" color={saved ? Colors.cream : Colors.cherry}>
          {label}
        </AppText>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  overlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 247, 239, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.cherry,
  },
  pillSaved: { backgroundColor: Colors.cherry },
});
