import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';
import { PressableScale } from './pressable-scale';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  floating?: boolean;
}

export function Chip({ label, selected, onPress, icon, floating }: ChipProps) {
  const color = selected ? Colors.white : Colors.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.selected : floating ? styles.floating : styles.idle,
      ]}>
      {icon ? <Ionicons name={icon} size={14} color={color} /> : null}
      <AppText style={[styles.label, { color }]}>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    maxWidth: '100%',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Radius.pill,
  },
  idle: { backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline },
  floating: { backgroundColor: Colors.surface, boxShadow: '0 2px 8px rgba(22, 44, 94, 0.12)' },
  selected: { backgroundColor: Colors.navy },
  label: { fontFamily: Fonts.sansMedium, fontSize: 13.5, flexShrink: 1 },
});
